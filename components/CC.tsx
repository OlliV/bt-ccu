import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import IconZoomIn from '@mui/icons-material/ZoomInMap';
import IconZoomOut from '@mui/icons-material/ZoomOutMap';
import IconColorBars from '@mui/icons-material/Gradient';
import { rgbaToHsva, hsvaToRgba } from '@uiw/color-convert';
import IconColor from '@mui/icons-material/ColorLens';
import IconRestart from '@mui/icons-material/RestartAlt';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Wheel from '@uiw/react-color-wheel';
import { useEffect, useState } from 'react';
import { useGlobalState } from '../lib/global';
import { Rgbl } from '../lib/ble/bcs';

const defaults: { [key: string]: Rgbl } = {
	lift: [0, 0, 0, 0],
	gamma: [0, 0, 0, 0],
	gain: [1, 1, 1, 1],
	offset: [0, 0, 0, 0],
};

const defaultContrast = [0.5, 1];
const defaultHueSat = [0, 1];

const wheelRanges: { [key: string]: { [key:string]: [number, number]} } = {
	limited: {
		lift: [-0.5, 0.5],
		gamma: [-1, 1],
		gain: [0.2, 1.5],
		offset: [-8, 8],
	},
	full: {
		lift: [-2, 2],
		gamma: [-4, 4],
		gain: [0, 16],
		offset: [-8, 8],
	},
};

function rgbl2hsva_i(ccmax: number, [r, g, b, l]: Rgbl) {
	const xmin = 0;
	const xmax = 255;
	const f = (xn) => (xn / ccmax) * (xmax - xmin) + xmin;

	return rgbaToHsva({ r: xmax - f(r), g: xmax - f(g), b: xmax - f(b), a: 1 });
}

function hsva2rgbl(ccmax: number, hsva): Rgbl {
	const xmin = 0;
	const xmax = 255;
	const rgba = hsvaToRgba(hsva);
	const f = (x: number) => ccmax * ((x - xmin) / (xmax - xmin));

	return [f(rgba.r), f(rgba.g), f(rgba.b), 0];
}

function hsva2rgbl_i(ccmax: number, hsva): Rgbl {
	const xmin = 0;
	const xmax = 255;
	const rgba = hsvaToRgba(hsva);
	const f = (x: number) => ccmax * ((x - xmin) / (xmax - xmin));

	return [f(xmax - rgba.r), f(xmax - rgba.g), f(xmax - rgba.b), 0];
}

function LumaSlider({
	disabled,
	min,
	max,
	value,
	onChange,
}: {
	disabled?: boolean,
	min: number;
	max: number;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<Slider
			value={value}
			disabled={disabled}
			valueLabelDisplay="auto"
			step={0.001}
			min={min}
			max={max}
			onChange={(_ev: Event, value: number) => onChange(value)}
		/>
	);
}

function ColorWheel({ disabled, name, range, value, setValue }: { disabled?: boolean, name: string, range: [number, number], value: Rgbl, setValue: (v: Rgbl) => void }) {
	const [min, max] = range;
	const [wheelHsva, setWheelHsv] = useState(() => rgbl2hsva_i(max, value));
	const newRGB = (v: Rgbl, rgb: Rgbl): Rgbl => [rgb[0], rgb[1], rgb[2], v[3]];
	const newLuma = (v: Rgbl, l: number): Rgbl => [v[0], v[1], v[2], l];
	const onChangeColor = (color) => setValue(newRGB(value, hsva2rgbl_i(max, color.hsva)));
	const onChangeLuma = (v: number) => setValue(newLuma(value, v));

	useEffect(() => {
		setWheelHsv(rgbl2hsva_i(max, value));
	}, [setWheelHsv, value]);

	// TODO Wide range button and cap the max normally
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>{name}</Typography>
			<Wheel color={disabled ? {h: 0, s: 0, v: 0, a: 0} : wheelHsva} onChange={onChangeColor} />
			<LumaSlider disabled={disabled} min={min} max={max} value={value[3]} onChange={onChangeLuma} />
		</Grid>
	);
}

function Contrast({ disabled, value, setValue }) {
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>Contrast</Typography>
			<LumaSlider disabled={disabled} min={0} max={1} value={value[0]} onChange={(v) => setValue([v, value[1]])} />
			<LumaSlider disabled={disabled} min={0} max={2} value={value[1]} onChange={(v) => setValue([value[0], v])} />
		</Grid>
	);
}

function HueSat({ disabled, value, setValue }) {
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>Hue &amp; Sat</Typography>
			<LumaSlider disabled={disabled} min={-1} max={1} value={value[0]} onChange={(v) => setValue([v, value[1]])} />
			<LumaSlider disabled={disabled} min={0} max={2} value={value[1]} onChange={(v) => setValue([value[0], v])} />
		</Grid>
	);
}

export default function ColorCorrector() {
	const [cameraControl] = useGlobalState('camera_control');
	const [lift, setLift] = useState(defaults.lift);
	const [gamma, setGamma] = useState(defaults.gamma);
	const [gain, setGain] = useState(defaults.gain);
	const [offset, setOffset] = useState(defaults.offset);
	const [contrast, setContrast] = useState(defaultContrast);
	const [hueSat, setHueSat] = useState(defaultHueSat);
	const [colorBars, setColorBars] = useState<boolean>(false);
	const [range, setRange] = useState<'limited' | 'full'>('limited');

	const toggleColorBars = () => setColorBars(!colorBars);
	const toggleRange = () => setRange(range == 'limited' ? 'full' : 'limited');
	const resetCC = () => {
		setLift(defaults.lift);
		setGamma(defaults.gamma);
		setGain(defaults.gain);
		setOffset(defaults.offset);
		setContrast(defaultContrast);
		setHueSat(defaultHueSat);
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
	useEffect(() => {
		// The camera will send 3.0 overlays message when it resets
		// but it doesn't contain any information whether bars are
		// still enabled. It also sends 3.0 right after bars have
		// been enabled...
		const timeout = colorBars ? 30 : 0;
		cameraControl && cameraControl.setColorBars(timeout);
	}, [cameraControl, colorBars]);

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
						<div>
							<IconButton
								disabled={!cameraControl}
								onClick={toggleColorBars}
								size="large"
								aria-label="Range"
								color="inherit"
							>
								<IconColorBars />
						    </IconButton>
							<IconButton
								disabled={!cameraControl}
								onClick={toggleRange}
								size="large"
								aria-label="Range"
								color="inherit"
							>
								{range == 'limited' ? <IconZoomOut /> : <IconZoomIn />}
							</IconButton>
							<IconButton
								disabled={!cameraControl}
								onClick={resetCC}
								size="large"
								aria-label="reset CC"
								color="inherit"
							>
								<IconRestart />
							</IconButton>
						</div>
					}
				/>
				<CardContent>
					<Grid container spacing={2}>
						<ColorWheel disabled={!cameraControl} range={wheelRanges[range].lift} name="Lift" value={lift} setValue={setLift} />
						<ColorWheel disabled={!cameraControl} range={wheelRanges[range].gamma} name="Gamma" value={gamma} setValue={setGamma} />
						<ColorWheel disabled={!cameraControl} range={wheelRanges[range].gain} name="Gain" value={gain} setValue={setGain} />
						<ColorWheel
							disabled={!cameraControl}
							range={wheelRanges[range].offset}
							name="Offset"
							value={offset}
							setValue={setOffset}
						/>
					</Grid>
					<Grid container spacing={2}>
						<Contrast disabled={!cameraControl} value={contrast} setValue={setContrast} />
						<HueSat disabled={!cameraControl} value={hueSat} setValue={setHueSat} />
					</Grid>
				</CardContent>
			</Card>
		</Grid>
	);
}
