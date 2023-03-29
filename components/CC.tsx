import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { rgbaToHsva, hsvaToRgba } from '@uiw/color-convert';
import IconColor from '@mui/icons-material/ColorLens';
import IconRestart from '@mui/icons-material/RestartAlt';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Wheel from '@uiw/react-color-wheel';
import { useGlobalState } from '../lib/global';
import { useEffect, useState } from 'react';

const defaults = {
	lift: [0, 0, 0, 0],
	gamma: [0, 0, 0, 0],
	gain: [1, 1, 1, 1],
	offset: [0, 0, 0, 0],
};

function rgbl2hsva_i(ccmax, [r, g, b, l]: number[]) {
	const xmin = 0;
	const xmax = 255;
	const f = (xn) => (xn / ccmax) * (xmax - xmin) + xmin;

	return rgbaToHsva({ r: xmax - f(r), g: xmax - f(g), b: xmax - f(b), a: 1 });
}

function hsva2rgbl(ccmax, hsva) {
	const xmin = 0;
	const xmax = 255;
	const rgba = hsvaToRgba(hsva);
	const f = (x: number) => ccmax * ((x - xmin) / (xmax - xmin));

	return [f(rgba.r), f(rgba.g), f(rgba.b), 0];
}

function hsva2rgbl_i(ccmax, hsva) {
	const xmin = 0;
	const xmax = 255;
	const rgba = hsvaToRgba(hsva);
	const f = (x: number) => ccmax * ((x - xmin) / (xmax - xmin));

	return [f(xmax - rgba.r), f(xmax - rgba.g), f(xmax - rgba.b), 0];
}

function LumaSlider({
	min,
	max,
	value,
	onChange,
}: {
	min: number;
	max: number;
	value: number;
	onChange: (value: number) => void;
}) {
	const [cameraControl] = useGlobalState('camera_control');

	return (
		<Slider
			value={value}
			disabled={!cameraControl}
			valueLabelDisplay="auto"
			step={0.001}
			min={min}
			max={max}
			onChange={(_ev: Event, value: number) => onChange(value)}
		/>
	);
}

function ColorWheel({ name, min, max, value, setValue }) {
	const [wheelHsva, setWheelHsv] = useState(() => rgbl2hsva_i(max, value));
	const newRGB = (v: number[], rgb: number[]) => [rgb[0], rgb[1], rgb[2], v[3]];
	const newLuma = (v: number[], l: number) => [v[0], v[1], v[2], l];

	useEffect(() => {
		setWheelHsv(rgbl2hsva_i(max, value));
	}, [setWheelHsv, value]);

	// TODO Wide range button and cap the max normally
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>{name}</Typography>
			<Wheel color={wheelHsva} onChange={(color) => setValue(newRGB(value, hsva2rgbl_i(max, color.hsva)))} />
			<LumaSlider min={min} max={max} value={value[3]} onChange={(v) => setValue(newLuma(value, v))} />
		</Grid>
	);
}

function Contrast({ value, setValue }) {
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>Contrast</Typography>
			<LumaSlider min={0} max={1} value={value[0]} onChange={(v) => setValue([v, value[1]])} />
			<LumaSlider min={0} max={2} value={value[1]} onChange={(v) => setValue([value[0], v])} />
		</Grid>
	);
}

function HueSat({ value, setValue }) {
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>Hue &amp; Sat</Typography>
			<LumaSlider min={-1} max={1} value={value[0]} onChange={(v) => setValue([v, value[1]])} />
			<LumaSlider min={0} max={2} value={value[1]} onChange={(v) => setValue([value[0], v])} />
		</Grid>
	);
}

export default function ColorCorrector() {
	const [cameraControl] = useGlobalState('camera_control');
	const [lift, setLift] = useState(defaults.lift);
	const [gamma, setGamma] = useState(defaults.gamma);
	const [gain, setGain] = useState(defaults.gain);
	const [offset, setOffset] = useState(defaults.offset);
	const [contrast, setContrast] = useState([0.5, 1]);
	const [hueSat, setHueSat] = useState([0, 1]);

	const resetCC = () => {
		setLift(defaults.lift);
		setGamma(defaults.gamma);
		setGain(defaults.gain);
		setOffset(defaults.offset);
		setContrast([0, 0]);
		setHueSat([0, 0]);
		cameraControl.resetCC();
	};

	useEffect(() => {
		cameraControl && cameraControl.setCCLift(lift);
	}, [cameraControl, lift]);
	useEffect(() => {
		cameraControl && cameraControl.setCCGamma(gamma);
	}, [cameraControl, gamma]);
	useEffect(() => {
		cameraControl && cameraControl.setCCGain(gain);
	}, [cameraControl, gain]);
	useEffect(() => {
		cameraControl && cameraControl.setCCOffset(offset);
	}, [cameraControl, offset]);
	useEffect(() => {
		cameraControl && cameraControl.setCCContrast(contrast);
	}, [cameraControl, contrast]);
	useEffect(() => {
		cameraControl && cameraControl.setCCColorAdjust(hueSat);
	}, [cameraControl, hueSat]);

	return (
		<Grid item xs={16}>
			<Card variant="outlined">
				<CardHeader
					avatar={
						<Avatar>
							<IconColor />
						</Avatar>
					}
					title="Color"
					action={
						<IconButton
							disabled={!cameraControl}
							onClick={resetCC}
							size="large"
							aria-label="reset CC"
							color="inherit"
						>
							<IconRestart />
						</IconButton>
					}
				/>
				<CardContent>
					<Grid container spacing={2}>
						<ColorWheel min={-2} max={2} name="Lift" value={lift} setValue={setLift} />
						<ColorWheel min={-4} max={4} name="Gamma" value={gamma} setValue={setGamma} />
						<ColorWheel min={0} max={16} name="Gain" value={gain} setValue={setGain} />
						<ColorWheel min={-8} max={8} name="Offset" value={offset} setValue={setOffset} />
					</Grid>
					<Grid container spacing={2}>
						<Contrast value={contrast} setValue={setContrast} />
						<HueSat value={hueSat} setValue={setHueSat} />
					</Grid>
				</CardContent>
			</Card>
		</Grid>
	);
}
