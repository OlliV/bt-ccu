import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconShutterSpeed from '@mui/icons-material/ShutterSpeed';
import Slider from '@mui/material/Slider';
import { useEffect, useState } from 'react';
import { getGlobalState, useGlobalState } from '../lib/global';
import { BCSParam } from '../lib/ble/bcs';

function valueText(value: number) {
	return `${value} dB`;
}

function AngleSlider() {
	const [cameraControl] = useGlobalState('camera_control');
	const [shutterAngle, setShutterAngle] = useGlobalState('shutter_angle');
	const marks = [
		{
			value: 11.2,
			label: '11.2 deg',
		},
		{
			value: 180,
			label: '180 deg',
		},
		{
			value: 360,
			label: '360 deg',
		},
	];

	useEffect(() => {
		const tid = setTimeout(() => {
			setShutterAngle(() => getGlobalState('res_shutter_angle'));
		}, 500);
		return () => clearTimeout(tid);
	}, [cameraControl]);
	useEffect(() => {
		if (cameraControl) {
			cameraControl.setShutterAngle(shutterAngle);
		}
	}, [cameraControl, shutterAngle]);

	return (
		<Slider
			sx={{ ml: 2, width: '80%' }}
			value={shutterAngle}
			disabled={!cameraControl}
			getAriaValueText={valueText}
			aria-labelledby="discrete-slider"
			valueLabelDisplay="auto"
			marks={marks}
			step={1}
			min={marks[0].value}
			max={marks[marks.length - 1].value}
			onChange={(_ev: Event, value: number) => setShutterAngle(value)}
		/>
	);
}

const gSpeeds = {
	24: [24, 48, 60, 96, 120, 198, 1000, 2000, 5000],
	25: [25, 30, 50, 60, 100, 125, 200, 250, 500, 1000, 2000, 5000],
	30: [30, 50, 60, 100, 125, 200, 250, 500, 1000, 2000, 5000],
	50: [50, 60, 100, 125, 200, 250, 500, 1000, 2000, 5000 ],
	60: [60, 100, 125, 200, 250, 500, 1000, 2000, 5000],
}

function getSpeeds(fps: number) {
	if (fps < 25) {
		return getSpeeds[24];
	} else if (fps < 30) {
		return gSpeeds[25];
	} else if (fps < 50) {
		return gSpeeds[30];
	} else if (fps < 60) {
		return gSpeeds[50];
	} else {
		return gSpeeds[60];
	}
}

function SpeedSlider() {
	const [cameraControl] = useGlobalState('camera_control');
	const [shutterSpeed, setShutterSpeed] = useGlobalState('shutter_speed');
	const [recFormat] = useGlobalState('res_recording_format');
	const fps = recFormat.sensorFps || 25;
	const speeds = getSpeeds(fps);
	const valueLabelFormat = (v: number) => `1/${speeds[v]}`
	const marks = speeds.map((v: number, i: number) => ({ value: i, label: ' ' }));

	useEffect(() => {
		const tid = setTimeout(() => {
			setShutterSpeed(() => getGlobalState('res_shutter_speed'));
		}, 500);
		return () => clearTimeout(tid);
	}, [cameraControl]);
	useEffect(() => {
		if (cameraControl) {
			cameraControl.setShutterSpeed(shutterSpeed);
		}
	}, [cameraControl, shutterSpeed]);

	return (
		<Slider
			sx={{ ml: 2, width: '80%' }}
			disabled={!cameraControl}
			getAriaValueText={valueText}
			aria-labelledby="discrete-slider"
			valueLabelDisplay="on"
			valueLabelFormat={valueLabelFormat}
			step={null}
			marks={marks}
			min={0}
			max={speeds.length - 1}
			onChange={(_ev: Event, value: number) => setShutterSpeed(speeds[value])}
		/>
	);
}

export default function Shutter() {
	const [cameraControl] = useGlobalState('camera_control');
	const [sType, setSType] = useState<'angle' | 'speed'>('speed');

	useEffect(() => {
		const cbA = () => {
			setSType('angle');
		};
		const cbS = () => {
			setSType('speed');
		};

		if (cameraControl) {
			cameraControl.addParamListener(BCSParam.ShutterAngle, cbA);
			cameraControl.addParamListener(BCSParam.ShutterSpeed, cbS);

			return () => {
				cameraControl.removeParamListener(BCSParam.ShutterAngle, cbA);
				cameraControl.removeParamListener(BCSParam.ShutterSpeed, cbS);
			};
		}
	}, [cameraControl]);

	return (
		<Grid item xs={4}>
			<Card variant="outlined">
				<CardHeader
					avatar={
						<Avatar>
							<IconShutterSpeed />
						</Avatar>
					}
					title="Shutter"
				/>
				<CardContent>
					{sType == 'angle' ? <AngleSlider /> : <SpeedSlider />}
				</CardContent>
			</Card>
		</Grid>
	);
}
