import { createGlobalState } from 'react-hooks-global-state';
import { BtDevice } from './ble';

const defaultScene = [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0.5, 1], [0, 1], 'limited'];

export type GlobalState = {
	// Devices
	btDevice_camera: null | BtDevice;
	// Control
	camera_control: any; // TODO Type
	// Set values
	aperture: number;
	manual_wb: [number, number];
	shutter_angle: number;
	shutter_speed: number;
	gain: number;
	// Reported values
	res_aperture: number;
	res_aperture_norm: number;
	res_recording_format: { sensorFps: number; mRate: boolean };
	res_shutter_angle: number;
	res_shutter_speed: number;
	res_wb: [number, number]; // temp, tint
	res_gain: number;
	res_nd_filter: number;
	//res_battery_status: {
	//	batteryPresent?: boolean;
	//	acPresent?: boolean;
	//	batteryIsCharging?: boolean;
	//	chargeRemainingPercentageIsEstimated?: boolean;
	//	preferVoltageDisplay?: boolean;
	//};
	// Settings
	cc_scenes: { 1: typeof defaultScene; 2: typeof defaultScene; 3: typeof defaultScene; 4: typeof defaultScene };
};

const LOCAL_STORAGE_KEY = 'settings';
const initialState: GlobalState = {
	// Devices
	btDevice_camera: null,
	// Control
	camera_control: null,
	// Set values
	aperture: 0,
	manual_wb: [5600, 10],
	shutter_angle: 180,
	shutter_speed: 50,
	gain: 0,
	// Reported values
	res_aperture: 1,
	res_aperture_norm: 0,
	res_recording_format: { sensorFps: NaN, mRate: false },
	res_shutter_angle: 180,
	res_shutter_speed: 50,
	res_wb: [5600, 10],
	res_gain: 0,
	res_nd_filter: 0,
	//res_battery_status: {},
	// Settings
	cc_scenes: { 1: defaultScene, 2: defaultScene, 3: defaultScene, 4: defaultScene },
	// Load config from local storage
	...(typeof window === 'undefined' ? {} : JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY))),
};

const { useGlobalState: _useGlobalState, getGlobalState, setGlobalState } = createGlobalState(initialState);

type ConfigKey = 'cc_scenes';

function useGlobalState(key: keyof GlobalState) {
	const [value, setValue] = _useGlobalState(key);

	const setAndSaveValue = (value: Parameters<typeof setValue>[0]) => {
		setValue(value);

		// Defer saving to not disturb the render loop.
		setTimeout(() => {
			saveConfig();
		}, 0);
	};

	return [value, setAndSaveValue] as const;
}

function saveConfig() {
	const config: { [k in ConfigKey]: any } = {
		cc_scenes: getGlobalState('cc_scenes'),
	};

	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
}

export { useGlobalState, getGlobalState, setGlobalState /* saveConfig */ };
