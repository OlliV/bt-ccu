import defer from '../defer';

const BLACKMAGIC_CAMERA_SERVICE_UUID = '291d567a-6d75-11e6-8b77-86f30ca893d3';
const CAMERA_CONTROL_CHARACTERISTIC_TX = '5dd3465f-1aee-4299-8493-d2eca2f8e1bb';
const CAMERA_CONTROL_CHARACTERISTIC_RX = 'b864e140-76a0-416a-bf30-5876504537d9';
const CAMERA_TIMECODE_CHARACTERISTIC = '6d8f2110-86f1-41bf-9afb-451d87e976c8';
const CAMERA_STATUS_CHARACTERISRIC = '7fe8691d-95dc-4fc5-8abd-ca74339b51b9';

type Rgbl = [number, number, number, number];

const BCSDataType: { [key: string]: number } = {
	void_t: 0,
	int8_t: 1,
	int16_t: 2,
	int32_t: 3,
	int64_t: 4,
	str_t: 5,
	fixed16_t: 128,
};

export const BCSParam: { [key: string]: [number, number] } = {
	Aperture: [0, 2],
	ManualWB: [1, 2],
	AutoWB: [1, 3],
	RecFormat: [1, 9],
	ShutterAngle: [1, 11],
	ShutterSpeed: [1, 12],
	Gain: [1, 13],
	ISO: [1, 14], // Not supported by URSA Broadcast G2
	NDFilter: [1, 16],
};

function toFixed16(value: number) {
	const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
	const fixed16 = Math.round(clamp(-16.0, 15 + 2047 / 2048, value) * 2048) & 0xffff;

	return fixed16;
}

function setSendHeader(msg: DataView, destDev: number, cmd: number, len: number) {
	msg.setUint8(0, destDev); // destination device
	msg.setUint8(1, len); // command length
	msg.setUint8(2, cmd); // command id
	msg.setUint8(3, 0x0); // reserved
}

export async function createBcs(server: BluetoothRemoteGATTServer) {
	const service = await server.getPrimaryService(BLACKMAGIC_CAMERA_SERVICE_UUID);
	const txCharacteristic = await service.getCharacteristic(CAMERA_CONTROL_CHARACTERISTIC_TX);
	const rxCharacteristic = await service.getCharacteristic(CAMERA_CONTROL_CHARACTERISTIC_RX);
	// TODO timecode
	const cameraStatusCharacteristic = await service.getCharacteristic(CAMERA_STATUS_CHARACTERISRIC);
	const paramListeners: { [key: string]: Array<(value: any) => void> } = {};
	const sendBufs: Map<string, ArrayBuffer> = new Map();
	let sendTim: ReturnType<typeof setTimeout> | null = null;

	const deferSend = (buf: ArrayBuffer) => {
		const msg = new DataView(buf);
		const destDev = msg.getUint8(1);
		const cmd = msg.getUint8(2);
		const key = `${destDev}.${cmd}.${cmd != 0 ? '' : `${msg.getUint8(4)}.${msg.getUint8(5)}`}`;

		sendBufs.set(key, buf);

		if (!sendTim) {
			sendTim = setTimeout(() => {
				for (const b of sendBufs.values()) {
					txCharacteristic.writeValue(b).catch(console.error);
				}
				sendTim = null;
				sendBufs.clear();
			}, 4);
		}
	};

	const bond = async () => {
		const buf = new ArrayBuffer(1);
		const msg = new DataView(buf);

		msg.setUint8(0, 0x01);

		await cameraStatusCharacteristic.writeValue(buf);
	};

	const setApertureNorm = async (value: number) => {
		const vfix = toFixed16(value);
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 6);
		msg.setUint8(4, 0); // cat: lens
		msg.setUint8(5, 3); // par: aperture (normalized)
		msg.setUint8(6, BCSDataType.fixed16); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix & 0xff);
		msg.setUint8(9, (vfix >> 8) & 0xff);

		deferSend(buf);
	};

	const setShutterAngle = (valueDeg: number) => {
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		valueDeg *= 100;

		setSendHeader(msg, 255, 0, 8);
		msg.setUint8(4, BCSParam.ShutterAngle[0]); // cat
		msg.setUint8(5, BCSParam.ShutterAngle[1]); // par
		msg.setUint8(6, BCSDataType.int32_t); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, valueDeg & 0xff);
		msg.setUint8(9, (valueDeg >> 8) & 0xff);
		msg.setUint8(10, (valueDeg >> 16) & 0xff);
		msg.setUint8(11, (valueDeg >> 24) & 0xff);

		deferSend(buf);
	};

	const setShutterSpeed = (value: number) => {
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 8);
		msg.setUint8(4, BCSParam.ShutterSpeed[0]); // cat
		msg.setUint8(5, BCSParam.ShutterSpeed[1]); // par
		msg.setUint8(6, BCSDataType.int32_t); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, value & 0xff);
		msg.setUint8(9, (value >> 8) & 0xff);
		msg.setUint8(10, (value >> 16) & 0xff);
		msg.setUint8(11, (value >> 24) & 0xff);

		deferSend(buf);
	};

	const setGain = (valueDb: number) => {
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 5);
		msg.setUint8(4, 1); // cat: video
		msg.setUint8(5, 13); // par: gain
		msg.setUint8(6, BCSDataType.int8_t); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, valueDb);
		msg.setUint8(9, 0);
		msg.setUint8(10, 0);
		msg.setUint8(11, 0);

		deferSend(buf);
	};

	const setWB = (value: [number, number]) => {
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		const temp = Math.round(value[0]) | 0;
		const tint = Math.round(value[1]) | 0;

		setSendHeader(msg, 255, 0, 8);
		msg.setUint8(4, BCSParam.ManualWB[0]); // cat
		msg.setUint8(5, BCSParam.ManualWB[1]); // par
		msg.setUint8(6, BCSDataType.int16_t); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, temp & 0xff);
		msg.setUint8(9, temp >> 8);
		msg.setUint8(10, tint && 0xff);
		msg.setUint8(11, tint >> 8);

		deferSend(buf);
	};

	const setAutoWB = () => {
		const buf = new ArrayBuffer(8);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 4);
		msg.setUint8(4, BCSParam.AutoWB[0]); // cat
		msg.setUint8(5, BCSParam.AutoWB[1]); // par
		msg.setUint8(6, BCSDataType.void_t); // type
		msg.setUint8(7, 0); // op: assign

		deferSend(buf);
	};

	const setCCrgbl = (par: number, rgbl: Rgbl) => {
		const vfix = rgbl.map(toFixed16);
		const buf = new ArrayBuffer(16);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 12);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, par);
		msg.setUint8(6, BCSDataType.fixed16_t); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix[0] & 0xff); // R
		msg.setUint8(9, vfix[0] >> 8);
		msg.setUint8(10, vfix[1] & 0xff); // G
		msg.setUint8(11, vfix[1] >> 8);
		msg.setUint8(12, vfix[2] & 0xff); // B
		msg.setUint8(13, vfix[2] >> 8);
		msg.setUint8(14, vfix[3] & 0xff); // L
		msg.setUint8(15, vfix[3] >> 8);

		deferSend(buf);
	};

	const setCCLift = (rgbl: Rgbl) => {
		setCCrgbl(0, rgbl);
	};

	const setCCGamma = (rgbl: Rgbl) => {
		setCCrgbl(1, rgbl);
	};

	const setCCGain = (rgbl: Rgbl) => {
		setCCrgbl(2, rgbl);
	};

	const setCCOffset = (rgbl: Rgbl) => {
		setCCrgbl(3, rgbl);
	};

	const setCCContrast = (pivot: number, adj: number) => {
		const vfix = [pivot, adj].map(toFixed16);
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 12);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, 4); // par: contrast
		msg.setUint8(6, BCSDataType.fixed16_t); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix[0] & 0xff); // pivot
		msg.setUint8(9, vfix[0] >> 8);
		msg.setUint8(10, vfix[1] & 0xff); // adj
		msg.setUint8(11, vfix[1] >> 8);

		deferSend(buf);
	};

	const setCCColorAdjust = (hue: number, sat: number) => {
		const vfix = [hue, sat].map(toFixed16);
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 12);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, 6); // par: color adjust
		msg.setUint8(6, BCSDataType.fixed16_t); // type
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix[0] & 0xff); // hue
		msg.setUint8(9, vfix[0] >> 8);
		msg.setUint8(10, vfix[1] & 0xff); // sat
		msg.setUint8(11, vfix[1] >> 8);

		deferSend(buf);
	};

	const resetCC = async () => {
		const buf = new ArrayBuffer(8);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 4);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, 7); // par: reset
		msg.setUint8(6, BCSDataType.void_t); // type
		msg.setUint8(7, 0); // op: assign

		await txCharacteristic.writeValue(buf);
	};

	const addParamListener = ([cat, par]: [number, number], cb: (value: any) => void) => {
		const name = `${cat}.${par}`;

		if (!paramListeners[name]) {
			paramListeners[name] = [];
		}
		paramListeners[name].push(cb);
	};

	const removeParamListener = (cat: number, par: number, cb: (value: any) => void) => {
		const name = `${cat}.${par}`;
		const i = paramListeners[name] ? paramListeners[name].indexOf(cb) : -1;
		if (i > -1) {
			paramListeners[name].splice(i, 1);
		}
	};

	rxCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
		// @ts-ignore
		const value = event.target.value;

		const [id, cat, par] = [value.getUint8(0), value.getUint8(4), value.getUint8(5)];

		if (id != 255) {
			return;
		}
		console.log(`got event: ${cat}.${par}`);

		const name = `${cat}.${par}`;
		const list = paramListeners[name];
		if (!list) {
			return;
		}

		let parsed: undefined | number | string | number[] | { sensorFps: number };

		const comp = (param: [number, number], cat: number, par: number) => param[0] == cat && param[1] == par;
		if (comp(BCSParam.Aperture, cat, par)) {
			const low = value.getUint8(8);
			const high = value.getUint8(9) << 8;
			parsed = (low + high) / 2048;
		} else if (comp(BCSParam.RecFormat, cat, par)) {
			const sensorFps = value.getUint8(10) | (value.getUint8(11) << 8);

			parsed = { sensorFps };
		} else if (comp(BCSParam.ManualWB, cat, par)) {
			const wbL = value.getUint8(8);
			const wbH = value.getUint8(9) << 8;
			const temp = wbL + wbH;

			const tintL = value.getUint8(10);
			const tintH = value.getUint8(11) << 8;
			const tint = tintL + tintH;

			if (temp > 10000 || tint > 50 || tint < -50) {
				// Sometimes the camera returns corrupted
				// WB after an auto WB op.
				return;
			}

			parsed = [temp, tint];
		} else if (comp(BCSParam.ShutterAngle, cat, par)) {
			parsed =
				value.getUint8(8) | (value.getUint8(9) << 8) | (value.getUint8(10) << 16) | (value.getUint8(11) << 24);
			parsed /= 100;
		} else if (comp(BCSParam.ShutterSpeed, cat, par)) {
			parsed =
				value.getUint8(8) | (value.getUint8(9) << 8) | (value.getUint8(10) << 16) | (value.getUint8(11) << 24);
		} else if (comp(BCSParam.Gain, cat, par)) {
			parsed = value.getUint8(8);
		} else if (comp(BCSParam.ISO, cat, par)) {
			parsed =
				value.getUint8(8) | (value.getUint8(9) << 8) | (value.getUint8(10) << 16) | (value.getUint8(11) << 24);
		} else if (comp(BCSParam.NDFilter, cat, par)) {
			const low = value.getUint8(8);
			const high = value.getUint8(9) << 8;
			parsed = (low + high) / 2048;
		}

		for (const cb of list) {
			cb(parsed);
		}
	});

	return {
		bond,
		startNotifications: () => rxCharacteristic.startNotifications(),
		setApertureNorm,
		setShutterAngle,
		setShutterSpeed,
		setGain,
		setWB,
		setAutoWB,
		setCCLift,
		setCCGamma,
		setCCGain,
		setCCOffset,
		setCCContrast,
		setCCColorAdjust,
		resetCC,
		addParamListener,
		removeParamListener,
	};
}
