import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconLight from '@mui/icons-material/LightMode';
import Slider from '@mui/material/Slider';
import { useGlobalState } from '../lib/global';
import { useEffect, useState } from 'react';

function valueText(value: number) {
	return `${value} dB`;
}

export default function Gain() {
	const [cameraControl] = useGlobalState('camera_control');
	const [gain, setGain] = useGlobalState('gain');
	const marks = [
		{
			value: -12,
			label: '-12 dB',
		},
		{
			value: 0,
			label: '0 dB',
		},
		{
			value: 36,
			label: '36 db',
		},
	];

	useEffect(() => {
		if (cameraControl && gain) {
			cameraControl.setGain(gain);
		}
	}, [cameraControl, gain]);

	return (
		<Grid item xs={4}>
			<Card variant="outlined">
				<CardHeader
					avatar={
						<Avatar>
							<IconLight />
						</Avatar>
					}
					title="Gain"
				/>
				<CardContent>
					<Slider
						value={gain}
						disabled={!cameraControl}
						getAriaValueText={valueText}
						aria-labelledby="discrete-slider"
						valueLabelDisplay="auto"
						marks={marks}
						step={2}
						min={marks[0].value}
						max={marks[marks.length - 1].value}
						onChangeCommitted={(_ev: Event, value: number) => setGain(value)}
					/>
				</CardContent>
			</Card>
		</Grid>
	);
}
