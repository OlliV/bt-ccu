import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconCamera from '@mui/icons-material/Videocam';
import Title from '../../components/Title';
import Typography from '@mui/material/Typography';
import { green } from '@mui/material/colors';
import SxPropsTheme from '../../lib/SxPropsTheme';
import { BtDevice, pairDevice } from '../../lib/ble';
import { BCSParam, createBcs } from '../../lib/ble/bcs';
import { useEffect, useState } from 'react';
import MyHead from '../../components/MyHead';
import { useGlobalState, getGlobalState } from '../../lib/global';

type Severity = 'error' | 'info' | 'success' | 'warning';

type InfoMessage = {
	message: string;
	severity: Severity;
};

const buttonProgressStyle: SxPropsTheme = {
	color: green[500],
	position: 'absolute',
	top: '50%',
	left: '50%',
	marginTop: -12,
	marginLeft: -12,
};
const iconStyle: SxPropsTheme = {
	fontSize: '18px !important',
};

function DeviceStatus({ wait, severity, children }: { wait?: boolean; severity: Severity; children: any }) {
	return (
		<CardContent>
			<Alert severity={severity}>{children}</Alert>
		</CardContent>
	);
}

function ActionButton({
	wait,
	onClick,
	disabled,
	children,
}: {
	wait: boolean;
	onClick?: () => void;
	disabled?: boolean;
	children: any;
}) {
	return (
		<Box>
			<Button disabled={wait || disabled} variant="contained" onClick={onClick}>
				{children}
				{wait && <CircularProgress size={24} sx={buttonProgressStyle} />}
			</Button>
		</Box>
	);
}

function Camera(props: { children: any }) {
	const pairedWithMessage = (btd): InfoMessage => ({
		message: btd ? `Paired with\n${btd.device.name}` : 'Not configured',
		severity: 'info',
	});
	const [btAvailable, setBtAvailable] = useState(false);
	const [pairingRequest, setPairingRequest] = useState(false);
	const [isPairing, setIsPairing] = useState(false);
	const [btDevice, setBtDevice] = useGlobalState('btDevice_camera') as [BtDevice, (BtDevice) => void];
	const [, setCameraControl] = useGlobalState('camera_control');
	const [, setRecFormat] = useGlobalState('res_recording_format');
	//const [, setAperture] = useGlobalState('aperture');
	//const [, setShutterAngle] = useGlobalState('shutter_angle');
	//const [, setManualWB] = useGlobalState('manual_wb');
	//const [, setGain] = useGlobalState('gain');
	let [info, setInfo] = useState<InfoMessage>(pairedWithMessage(btDevice));

	const unpairDevice = () => {
		if (btDevice) {
			if (btDevice.device.gatt.connected) {
				//@ts-ignore
				btDevice.disconnect();
			}
			setBtDevice(null);
			setInfo(pairedWithMessage(null));
			setIsPairing(false);
		}
	};

	useEffect(() => {
		navigator.bluetooth
			.getAvailability()
			.then((v) => setBtAvailable(v))
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (pairingRequest) {
			setPairingRequest(false);
			setIsPairing(true);
			if (btDevice && btDevice.device.gatt.connected) {
				unpairDevice();
			}

			(async () => {
				try {
					setInfo({ message: 'Requesting BLE Device...', severity: 'info' });

					const newBtDevice = await pairDevice(
						'291d567a-6d75-11e6-8b77-86f30ca893d3', // Blackmagic Camera Service
						async ({ device, server }) => {
							try {
								// TODO start notifications etc
								const controller = await createBcs(server);
								await controller.bond();
								controller.addParamListener(BCSParam.RecFormat, setRecFormat);
								// TODO Unfortunately the camera also sends these messages
								// when we control the camera. So we don't know whether it was
								// us or the operator.
								//controller.addParamListener(BCSParam.Aperture, setAperture);
								//controller.addParamListener(BCSParam.ShutterAngle, setShutterAngle);
								//controller.addParamListener(BCSParam.ManualWB, setManualWB);
								//controller.addParamListener(BCSParam.Gain, setGain);
								await controller.startNotifications();
								setCameraControl(controller);
							} catch (err) {
								setInfo({ message: `${err}`, severity: 'error' });
							}
						},
						() => {
							// Unpair if we can't reconnect.
							unpairDevice();
						}
					);

					const { device } = newBtDevice;
					console.log(`> Name: ${device.name}\n> Id: ${device.id}\n> Connected: ${device.gatt.connected}`);
					setInfo(pairedWithMessage(newBtDevice));
					setBtDevice(newBtDevice);
				} catch (err) {
					const msg = `${err}`;
					if (msg.startsWith('NotFoundError: User cancelled')) {
						setInfo({ message: 'Pairing cancelled', severity: 'warning' });
					} else {
						setInfo({ message: `${err}`, severity: 'error' });
					}
				} finally {
					setIsPairing(false);
				}
			})();
		}
	}, [pairingRequest]);

	const scanDevices = () => {
		setPairingRequest(true);
	};

	return (
		<Grid item xs="auto">
			<Card variant="outlined">
				<CardContent sx={{ height: '15em' }}>
					<Typography gutterBottom variant="h5" component="h2">
						{props.children}
					</Typography>
					<Box>
						<DeviceStatus wait={isPairing} severity={info.severity}>
							{info.message.split('\n').map((line, i) => (
								<span key={i}>
									{`${line}`}
									<br />
								</span>
							))}
						</DeviceStatus>
					</Box>
				</CardContent>
				<CardActions>
					<ActionButton wait={isPairing} disabled={!btAvailable} onClick={scanDevices}>
						Scan
					</ActionButton>
					<ActionButton wait={false} disabled={!btDevice} onClick={unpairDevice}>
						Unpair
					</ActionButton>
				</CardActions>
			</Card>
		</Grid>
	);
}

export default function Setup() {
	return (
		<Container maxWidth="md">
			<MyHead title="Setup" />
			<Box>
				<Title href="/">Setup</Title>
				<p>Connect your camera.</p>

				<Grid container direction="row" alignItems="center" spacing={2}>
					<Camera>
						<IconCamera sx={iconStyle} /> Camera
					</Camera>
				</Grid>
			</Box>
		</Container>
	);
}
