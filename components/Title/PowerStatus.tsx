import { BatteryLevel, PowerAdapter } from '../BatteryLevel';
import { useGlobalState } from '../../lib/global';
import {useEffect} from 'react';

// Unfortunately 9.0 is very unstable.
// It just oscillates between AC on and off.

export default function PowerStatus() {
	const [batteryStatus] = useGlobalState('res_battery_status');

	useEffect(() => {
		console.log(batteryStatus);
	}, [batteryStatus]);

	if (batteryStatus.acPresent && !batteryStatus.batteryIsCharging) {
		return <PowerAdapter />
	} else if (batteryStatus.batteryPresent) {
		return <BatteryLevel batteryLevel={-1} isCharging={batteryStatus.batteryIsCharging} />
	} else {
		return <BatteryLevel batteryLevel={-1} />
	}
}
