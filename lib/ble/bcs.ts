import defer from '../defer';

const BLACKMAGIC_CAMERA_SERVICE_UUID = '291d567a-6d75-11e6-8b77-86f30ca893d3';
const CAMERA_CONTROL_CHARACTERISTIC_TX = '5dd3465f-1aee-4299-8493-d2eca2f8e1bb';
const CAMERA_CONTROL_CHARACTERISTIC_RX = 'b864e140-76a0-416a-bf30-5876504537d9';
const CAMERA_TIMECODE_CHARACTERISTIC = '6d8f2110-86f1-41bf-9afb-451d87e976c8';
const CAMERA_STATUS_CHARACTERISRIC = '7fe8691d-95dc-4fc5-8abd-ca74339b51b9';

type Rgbl = [number, number, number, number];

export const BCSParam: {[key: string]: [number, number]} = {
	Aperture: [0, 2],
	ManualWB: [1, 2],
	ShutterAngle: [1, 11],
	ShutterSpeed: [1, 12],
	Gain: [1, 13],
	ISO: [1, 14], // Not supported by URSA Broadcast G2
};

function toFixed16(value: number) {
	const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
	const fixed16 = Math.round(clamp(-16.0, (15 + 2047 / 2048), value) * 2048) & 0xffff;

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
	const paramListeners: { [key: string]: Array<(value: number | string | undefined | number[]) => void> } = {};

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
		msg.setUint8(6, 128); // type: fixed16
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix & 0xff);
		msg.setUint8(9, (vfix >> 8) & 0xff);

		await txCharacteristic.writeValue(buf);
	};

	const setShutterAngle = async (valueDeg: number) => {
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 5);
		msg.setUint8(4, 1); // cat: video
		msg.setUint8(5, 13); // par: gain
		msg.setUint8(6, 3); // type: int32
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, valueDeg & 0xff);
		msg.setUint8(9, (valueDeg >> 8) & 0xff);
		msg.setUint8(10, (valueDeg >> 16) & 0xff);
		msg.setUint8(11, (valueDeg >> 24) & 0xff);

		await txCharacteristic.writeValue(buf);
	};

	const setGain = async (valueDb: number) => {
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 5);
		msg.setUint8(4, 1); // cat: video
		msg.setUint8(5, 13); // par: gain
		msg.setUint8(6, 1); // type: int8
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, valueDb);
		msg.setUint8(9, 0);
		msg.setUint8(10, 0);
		msg.setUint8(11, 0);

		await txCharacteristic.writeValue(buf);
	};

	const setWB = async (value: [number, number]) => {
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		const temp = Math.round(value[0]) | 0;
		const tint = Math.round(value[1]) | 0;

		setSendHeader(msg, 255, 0, 8);
		msg.setUint8(4, 1); // cat: video
		msg.setUint8(5, 2); // par: manual wb
		msg.setUint8(6, 2); // type: int16
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, temp & 0xff);
		msg.setUint8(9, temp >> 8);
		msg.setUint8(10, tint && 0xff);
		msg.setUint8(11, tint >> 8);

		await txCharacteristic.writeValue(buf);
	};

	const setCCrgbl = async (par: number, rgbl: Rgbl) => {
		const vfix = rgbl.map(toFixed16);
		const buf = new ArrayBuffer(16);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 12);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, par);
		msg.setUint8(6, 128); // type: fixed16
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix[0] & 0xff); // R
		msg.setUint8(9, vfix[0] >> 8);
		msg.setUint8(10, vfix[1] & 0xff); // G
		msg.setUint8(11, vfix[1] >> 8);
		msg.setUint8(12, vfix[2] & 0xff); // B
		msg.setUint8(13, vfix[2] >> 8);
		msg.setUint8(14, vfix[3] & 0xff); // L
		msg.setUint8(15, vfix[3] >> 8);

		await txCharacteristic.writeValue(buf);
	};

	const setCCLift = async (rgbl: Rgbl) => {
		return setCCrgbl(0, rgbl);
	}

	const setCCGamma = async (rgbl: Rgbl) => {
		return setCCrgbl(1, rgbl);
	};

	const setCCGain = async (rgbl: Rgbl) => {
		return setCCrgbl(2, rgbl);
	};

	const setCCOffset = async (rgbl: Rgbl) => {
		return setCCrgbl(3, rgbl);
	};

	const setCCContrast = async (pivot: number, adj: number) => {
		const vfix = [pivot, adj].map(toFixed16);
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 12);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, 4); // par: contrast
		msg.setUint8(6, 128); // type: fixed16
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix[0] & 0xff); // pivot
		msg.setUint8(9, vfix[0] >> 8);
		msg.setUint8(10, vfix[1] & 0xff); // adj
		msg.setUint8(11, vfix[1] >> 8);

		await txCharacteristic.writeValue(buf);
	};

	const setCCColorAdjust = async (hue: number, sat: number) => {
		const vfix = [hue, sat].map(toFixed16);
		const buf = new ArrayBuffer(12);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 12);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, 6); // par: color adjust
		msg.setUint8(6, 128); // type: fixed16
		msg.setUint8(7, 0); // op: assign
		msg.setUint8(8, vfix[0] & 0xff); // hue
		msg.setUint8(9, vfix[0] >> 8);
		msg.setUint8(10, vfix[1] & 0xff); // sat
		msg.setUint8(11, vfix[1] >> 8);

		await txCharacteristic.writeValue(buf);
	};

	const resetCC = async () => {
		const buf = new ArrayBuffer(8);
		const msg = new DataView(buf);

		setSendHeader(msg, 255, 0, 4);
		msg.setUint8(4, 8); // cat: color correction
		msg.setUint8(5, 7); // par: reset
		msg.setUint8(6, 0); // type: void
		msg.setUint8(7, 0); // op: assign

		await txCharacteristic.writeValue(buf);
	};

	const addParamListener = ([cat, par]: [number, number], cb: (value: number) => void) => {
		const name = `${cat}.${par}`;

		if (!paramListeners[name]) {
			paramListeners[name] = [];
		}
		paramListeners[name].push(cb);
	};

	const removeParamListener = (cat: number, par: number, cb: (value: number) => void) => {
		const name = `${cat}.${par}`;
		const i = paramListeners[name].indexOf(cb);
		if (i > -1) {
			paramListeners[name].splice(i, 1);
		}
	};

	rxCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
		// @ts-ignore
		const value = event.target.value;

		const [id, cat, par] = [
			value.getUint8(0),
			value.getUint8(4),
			value.getUint8(5),
		];

		console.log(id, cat, par);
		if (id != 255) {
			return;
		}

		const name = `${cat}.${par}`;
		const list = paramListeners[name];
		if (!list) {
			return;
		}

		let parsed: undefined | number | string | number[];

		const comp = (param: [number, number], cat: number, par: number) => param[0] == cat && param[1] == par;
		if (comp(BCSParam.Aperture, cat, par)) {
			const low = value.getUint8(8);
			const high = value.getUint8(9) << 8;
			const aperture = Math.sqrt(Math.pow(2, (low + high / 2048)));
			parsed = aperture;
		} else if (comp(BCSParam.ManualWB, cat, par)) {
			const wbL = value.getUint8(8);
			const wbH = value.getUint8(9) << 8;
			const whiteBalance = wbL + wbH;

			const tintL = value.getUint8(10);
			const tintH = value.getUint8(11) << 8;
			const tint = tintL + tintH;

			parsed = [whiteBalance, tint];
		} else if (comp(BCSParam.ShutterAngle, cat, par)) {
			parsed = value.getUint8(8) + value.getUint8(9) << 8 + value.getUint8(10) << 16 + value.getUint8(11) << 24;
		} else if (comp(BCSParam.ShutterSpeed, cat, par)) {
			parsed = value.getUint8(8) + value.getUint8(9) << 8 + value.getUint8(10) << 16 + value.getUint8(11) << 24;
		} else if (comp(BCSParam.Gain, cat, par)) {
			parsed = value.getUint8(8);
		} else if (comp(BCSParam.ISO, cat, par)) {
			parsed = value.getUint8(8) + value.getUint8(9) << 8 + value.getUint8(10) << 16 + value.getUint8(11) << 24;
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
		setGain,
		setWB,
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
