import { createGlobalState } from 'react-hooks-global-state';
import { BtDevice } from './ble';

export type GlobalState = {
	// Devices
	btDevice_camera: null | BtDevice;
	// Control
	camera_control: any; // TODO Type
	// Values
	aperture: number;
	manual_wb: number;
	shutter_angle: number;
	gain: number;
};

const LOCAL_STORAGE_KEY = 'settings';
const initialState: GlobalState = {
	// Devices
	btDevice_camera: null,
	// Control
	camera_control: null,
	// Values
	aperture: 0,
	manual_wb: [5600, 10],
	shutter_angle: 180,
	gain: 0,
	// Load config from local storage
	...(typeof window === 'undefined' ? {} : JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY))),
};

const { useGlobalState: _useGlobalState, getGlobalState, setGlobalState } = createGlobalState(initialState);

type ConfigKey = 'gain';

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
		gain: getGlobalState('gain'),
	};

	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
}

export { useGlobalState, getGlobalState, setGlobalState, saveConfig };
