import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconServo from '@mui/icons-material/SwitchVideo';
import InputAdornment from '@mui/material/InputAdornment';
import MuiInput from '@mui/material/OutlinedInput';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import { use, useEffect, useState } from 'react';
import { getGlobalState, useGlobalState } from '../lib/global';
import { BCSParam } from '../lib/ble/bcs';

function valueText(value: number) {
	return `${value}`;
}

const Input = styled(MuiInput)`
	width: 5.5em;
`;

export default function Servo() {
	const [cameraControl] = useGlobalState('camera_control');
	const [zoom, setZoom] = useGlobalState('zoom_norm');
	const [focus, setFocus] = useGlobalState('focus_norm');
	const marksZoom = [
		{
			value: 0,
			label: '0',
		},
		{
			value: 1,
			label: '1',
		},
	];
	const marksFocus = [
		{
			value: 0,
			label: '0',
		},
		{
			value: 1,
			label: '∞',
		},
	];

	/*
	 * Get the initial slider positions
	 */
	useEffect(() => {
		const tid = setTimeout(() => {
			setFocus(() => getGlobalState('res_focus_norm'));
			setZoom(() => getGlobalState('res_zoom_norm'));
		}, 1000);
		return () => clearTimeout(tid);
	}, [cameraControl]);

	useEffect(() => {
		if (cameraControl) {
			cameraControl.setFocusNorm(focus);
		}
	}, [cameraControl, focus]);
	useEffect(() => {
		if (cameraControl) {
			cameraControl.setZoomNorm(zoom);
		}
	}, [cameraControl, zoom]);

	return (
		<Grid item xs={3}>
			<Card variant="outlined">
				<CardHeader
					avatar={
						<Avatar>
							<IconServo />
						</Avatar>
					}
					title="Focus &amp; Zoom"
				/>
				<CardContent>
					<Stack sx={{ height: 300 }} spacing={1} direction="row">
						<Slider
							orientation="vertical"
							value={focus}
							disabled={!cameraControl}
							valueLabelDisplay="auto"
							marks={marksFocus}
							step={0.0001}
							min={0}
							max={1}
							onChange={(_ev: Event, value: number) => setFocus(value)}
						/>
						<Slider
							orientation="vertical"
							value={zoom}
							disabled={!cameraControl}
							valueLabelDisplay="auto"
							marks={marksZoom}
							step={0.001}
							min={0}
							max={1}
							onChange={(_ev: Event, value: number) => setZoom(value)}
						/>
					</Stack>
				</CardContent>
			</Card>
		</Grid>
	);
}
