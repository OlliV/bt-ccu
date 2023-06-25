import Avatar from '@mui/material/Avatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconLooks1 from '@mui/icons-material/LooksOne';
import IconLooks2 from '@mui/icons-material/LooksTwo';
import IconLooks3 from '@mui/icons-material/Looks3';
import IconLooks4 from '@mui/icons-material/Looks4';
import IconButton from '@mui/material/IconButton';
import IconColor from '@mui/icons-material/ColorLens';
import IconColorBars from '@mui/icons-material/Gradient';
import IconRestart from '@mui/icons-material/RestartAlt';
import IconSave from '@mui/icons-material/Save';
import IconZoomIn from '@mui/icons-material/ZoomInMap';
import IconZoomOut from '@mui/icons-material/ZoomOutMap';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Wheel from '@uiw/react-color-wheel';
import { rgbaToHsva, hsvaToRgba } from '@uiw/color-convert';
import { Fragment, useEffect, useState } from 'react';
import { setGlobalState, useGlobalState } from '../lib/global';
import { Rgbl } from '../lib/ble/bcs';
import { Tooltip } from '@mui/material';

const defaults: { [key: string]: Rgbl } = {
	lift: [0, 0, 0, 0],
	gamma: [0, 0, 0, 0],
	gain: [1, 1, 1, 1],
	offset: [0, 0, 0, 0],
};

const defaultContrast = [0.5, 1];
const defaultHueSat = [0, 1];

const wheelRanges: { [key: string]: { [key: string]: [number, number] } } = {
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
	disabled?: boolean;
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

function ColorWheel({
	disabled,
	name,
	range,
	value,
	setValue,
}: {
	disabled?: boolean;
	name: string;
	range: [number, number];
	value: Rgbl;
	setValue: (v: Rgbl) => void;
}) {
	const [min, max] = range;
	const [wheelHsva, setWheelHsv] = useState(() => rgbl2hsva_i(max, value));
	const newRGB = (v: Rgbl, rgb: Rgbl): Rgbl => [rgb[0], rgb[1], rgb[2], v[3]];
	const newLuma = (v: Rgbl, l: number): Rgbl => [v[0], v[1], v[2], l];
	const onChangeColor = (color) => setValue(newRGB(value, hsva2rgbl_i(max, color.hsva)));
	const onChangeLuma = (v: number) => setValue(newLuma(value, v));

	useEffect(() => {
		setWheelHsv(rgbl2hsva_i(max, value));
	}, [setWheelHsv, max, value]);

	// TODO Wide range button and cap the max normally
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>{name}</Typography>
			<Wheel color={disabled ? { h: 0, s: 0, v: 0, a: 0 } : wheelHsva} onChange={onChangeColor} />
			<LumaSlider disabled={disabled} min={min} max={max} value={value[3]} onChange={onChangeLuma} />
		</Grid>
	);
}

function Contrast({ disabled, value, setValue }) {
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>Contrast</Typography>
			<LumaSlider
				disabled={disabled}
				min={0}
				max={1}
				value={value[0]}
				onChange={(v) => setValue([v, value[1]])}
			/>
			<LumaSlider
				disabled={disabled}
				min={0}
				max={2}
				value={value[1]}
				onChange={(v) => setValue([value[0], v])}
			/>
		</Grid>
	);
}

function HueSat({ disabled, value, setValue }) {
	return (
		<Grid item xs={3}>
			<Typography gutterBottom>Hue &amp; Sat</Typography>
			<LumaSlider
				disabled={disabled}
				min={-1}
				max={1}
				value={value[0]}
				onChange={(v) => setValue([v, value[1]])}
			/>
			<LumaSlider
				disabled={disabled}
				min={0}
				max={2}
				value={value[1]}
				onChange={(v) => setValue([value[0], v])}
			/>
		</Grid>
	);
}

function ScenesMenu({
	disabled,
	loadScene,
	saveScene,
}: {
	disabled: boolean;
	loadScene: (n: number) => void;
	saveScene: (n: number) => void;
}) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	const handleLoad = (n: number) => {
		setAnchorEl(null);
		loadScene(n);
	};
	const handleSave = (n: number) => {
		setAnchorEl(null);
		saveScene(n);
	};

	return (
		<Fragment>
			<IconButton disabled={disabled} onClick={handleClick} size="large" aria-label="Range" color="inherit">
				<IconSave />
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				id="account-menu"
				open={open}
				onClose={handleClose}
				onClick={handleClose}
				PaperProps={{
					elevation: 0,
					sx: {
						overflow: 'visible',
						filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
						mt: 1.5,
						'& .MuiAvatar-root': {
							width: 32,
							height: 32,
							ml: -0.5,
							mr: 1,
						},
						'&:before': {
							content: '""',
							display: 'block',
							position: 'absolute',
							top: 0,
							right: 14,
							width: 10,
							height: 10,
							bgcolor: 'background.paper',
							transform: 'translateY(-50%) rotate(45deg)',
							zIndex: 0,
						},
					},
				}}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
			>
				<MenuItem onClick={() => handleLoad(1)}>
					<ListItemIcon>
						<IconLooks1 />
					</ListItemIcon>{' '}
					Load Scene 1
				</MenuItem>
				<MenuItem onClick={() => handleLoad(2)}>
					<ListItemIcon>
						<IconLooks2 />
					</ListItemIcon>{' '}
					Load Scene 2
				</MenuItem>
				<MenuItem onClick={() => handleLoad(3)}>
					<ListItemIcon>
						<IconLooks3 />
					</ListItemIcon>{' '}
					Load Scene 3
				</MenuItem>
				<MenuItem onClick={() => handleLoad(4)}>
					<ListItemIcon>
						<IconLooks4 />
					</ListItemIcon>{' '}
					Load Scene 4
				</MenuItem>
				<Divider />
				<MenuItem onClick={() => handleSave(1)}>
					<ListItemIcon>
						<IconLooks1 />
					</ListItemIcon>{' '}
					Save Scene 1
				</MenuItem>
				<MenuItem onClick={() => handleSave(2)}>
					<ListItemIcon>
						<IconLooks2 />
					</ListItemIcon>{' '}
					Save Scene 2
				</MenuItem>
				<MenuItem onClick={() => handleSave(3)}>
					<ListItemIcon>
						<IconLooks3 />
					</ListItemIcon>{' '}
					Save Scene 3
				</MenuItem>
				<MenuItem onClick={() => handleSave(4)}>
					<ListItemIcon>
						<IconLooks4 />
					</ListItemIcon>{' '}
					Save Scene 4
				</MenuItem>
			</Menu>
		</Fragment>
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
	const [scenes, setScenes] = useGlobalState('cc_scenes');

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

	const loadScene = (n: number) => {
		const scene = scenes[n];
		if (scene && scene.length == 7) {
			setLift(scene[0]);
			setGamma(scene[1]);
			setGain(scene[2]);
			setOffset(scene[3]);
			setContrast(scene[4]);
			setHueSat(scene[5]);
			setRange(scene[6]);
		}
	};
	const saveScene = (n: number) => {
		setScenes({ ...scenes, [n]: [lift, gamma, gain, offset, contrast, hueSat, range] });
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
						<Fragment>
							<Tooltip title="Scenes">
								<ScenesMenu disabled={!cameraControl} loadScene={loadScene} saveScene={saveScene} />
							</Tooltip>
							<Tooltip title="Color bars">
								<IconButton
									disabled={!cameraControl}
									onClick={toggleColorBars}
									size="large"
									aria-label="Range"
									color="inherit"
								>
									<IconColorBars />
								</IconButton>
							</Tooltip>
							<Tooltip title="Color wheels range">
								<IconButton
									disabled={!cameraControl}
									onClick={toggleRange}
									size="large"
									aria-label="Range"
									color="inherit"
								>
									{range == 'limited' ? <IconZoomOut /> : <IconZoomIn />}
								</IconButton>
							</Tooltip>
							<Tooltip title="Reset">
								<IconButton
									disabled={!cameraControl}
									onClick={resetCC}
									size="large"
									aria-label="reset CC"
									color="inherit"
								>
									<IconRestart />
								</IconButton>
							</Tooltip>
						</Fragment>
					}
				/>
				<CardContent>
					<Grid container spacing={2}>
						<ColorWheel
							disabled={!cameraControl}
							range={wheelRanges[range].lift}
							name="Lift"
							value={lift}
							setValue={setLift}
						/>
						<ColorWheel
							disabled={!cameraControl}
							range={wheelRanges[range].gamma}
							name="Gamma"
							value={gamma}
							setValue={setGamma}
						/>
						<ColorWheel
							disabled={!cameraControl}
							range={wheelRanges[range].gain}
							name="Gain"
							value={gain}
							setValue={setGain}
						/>
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
