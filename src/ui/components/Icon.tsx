import { ArrowDownRightIcon } from 'phosphor-react-native/src/icons/ArrowDownRight';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArrowUpRightIcon } from 'phosphor-react-native/src/icons/ArrowUpRight';
import { ArrowsLeftRightIcon } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { BankIcon } from 'phosphor-react-native/src/icons/Bank';
import { BrainIcon } from 'phosphor-react-native/src/icons/Brain';
import { BriefcaseIcon } from 'phosphor-react-native/src/icons/Briefcase';
import { BugIcon } from 'phosphor-react-native/src/icons/Bug';
import { BuildingsIcon } from 'phosphor-react-native/src/icons/Buildings';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { ChartBarIcon } from 'phosphor-react-native/src/icons/ChartBar';
import { ChartLineUpIcon } from 'phosphor-react-native/src/icons/ChartLineUp';
import { ChatCircleDotsIcon } from 'phosphor-react-native/src/icons/ChatCircleDots';
import { ChatsCircleIcon } from 'phosphor-react-native/src/icons/ChatsCircle';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { ClockCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ClockCounterClockwise';
import { CoffeeIcon } from 'phosphor-react-native/src/icons/Coffee';
import { CoinsIcon } from 'phosphor-react-native/src/icons/Coins';
import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard';
import { CubeIcon } from 'phosphor-react-native/src/icons/Cube';
import { CurrencyDollarIcon } from 'phosphor-react-native/src/icons/CurrencyDollar';
import { DatabaseIcon } from 'phosphor-react-native/src/icons/Database';
import { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile';
import { DoorOpenIcon } from 'phosphor-react-native/src/icons/DoorOpen';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { FireIcon } from 'phosphor-react-native/src/icons/Fire';
import { FlagIcon } from 'phosphor-react-native/src/icons/Flag';
import { FlaskIcon } from 'phosphor-react-native/src/icons/Flask';
import { ForkKnifeIcon } from 'phosphor-react-native/src/icons/ForkKnife';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { GiftIcon } from 'phosphor-react-native/src/icons/Gift';
import { GlobeHemisphereWestIcon } from 'phosphor-react-native/src/icons/GlobeHemisphereWest';
import { HandshakeIcon } from 'phosphor-react-native/src/icons/Handshake';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { LightbulbIcon } from 'phosphor-react-native/src/icons/Lightbulb';
import { LightningIcon } from 'phosphor-react-native/src/icons/Lightning';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import { MountainsIcon } from 'phosphor-react-native/src/icons/Mountains';
import { NewspaperIcon } from 'phosphor-react-native/src/icons/Newspaper';
import { PaintBrushIcon } from 'phosphor-react-native/src/icons/PaintBrush';
import { PaperPlaneTiltIcon } from 'phosphor-react-native/src/icons/PaperPlaneTilt';
import { PercentIcon } from 'phosphor-react-native/src/icons/Percent';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { RocketIcon } from 'phosphor-react-native/src/icons/Rocket';
import { ScalesIcon } from 'phosphor-react-native/src/icons/Scales';
import { ScissorsIcon } from 'phosphor-react-native/src/icons/Scissors';
import { ScrollIcon } from 'phosphor-react-native/src/icons/Scroll';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { StorefrontIcon } from 'phosphor-react-native/src/icons/Storefront';
import { StrategyIcon } from 'phosphor-react-native/src/icons/Strategy';
import { SunIcon } from 'phosphor-react-native/src/icons/Sun';
import { TargetIcon } from 'phosphor-react-native/src/icons/Target';
import { TrophyIcon } from 'phosphor-react-native/src/icons/Trophy';
import { UmbrellaIcon } from 'phosphor-react-native/src/icons/Umbrella';
import { UserCircleIcon } from 'phosphor-react-native/src/icons/UserCircle';
import { UserMinusIcon } from 'phosphor-react-native/src/icons/UserMinus';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { UserSwitchIcon } from 'phosphor-react-native/src/icons/UserSwitch';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { WalletIcon } from 'phosphor-react-native/src/icons/Wallet';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { WrenchIcon } from 'phosphor-react-native/src/icons/Wrench';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';

/** The single icon set (Phosphor). Regular weight by default; filled for emphasis and selection. */
const ICONS = {
  home: HouseIcon,
  product: CubeIcon,
  people: UsersThreeIcon,
  money: WalletIcon,
  world: GlobeHemisphereWestIcon,
  company: BuildingsIcon,
  settings: GearSixIcon,
  close: XIcon,
  next: CaretRightIcon,
  back: CaretLeftIcon,
  forward: ArrowRightIcon,
  locked: LockSimpleIcon,
  warning: WarningIcon,
  check: CheckIcon,
  up: ArrowUpRightIcon,
  down: ArrowDownRightIcon,
  history: ClockCounterClockwiseIcon,
  share: ShareNetworkIcon,
  add: PlusIcon,
  info: InfoIcon,
  rocket: RocketIcon,
  userPlus: UserPlusIcon,
  userMinus: UserMinusIcon,
  handshake: HandshakeIcon,
  chart: ChartLineUpIcon,
  bug: BugIcon,
  wrench: WrenchIcon,
  lightning: LightningIcon,
  shield: ShieldCheckIcon,
  target: TargetIcon,
  swap: ArrowsLeftRightIcon,
  flask: FlaskIcon,
  moon: MoonIcon,
  brush: PaintBrushIcon,
  chats: ChatsCircleIcon,
  megaphone: MegaphoneIcon,
  coffee: CoffeeIcon,
  mic: MicrophoneIcon,
  star: StarIcon,
  trophy: TrophyIcon,
  flag: FlagIcon,
  newspaper: NewspaperIcon,
  scales: ScalesIcon,
  heart: HeartIcon,
  compass: CompassIcon,
  dinner: ForkKnifeIcon,
  card: CreditCardIcon,
  bank: BankIcon,
  scissors: ScissorsIcon,
  envelope: EnvelopeSimpleIcon,
  briefcase: BriefcaseIcon,
  user: UserCircleIcon,
  dollar: CurrencyDollarIcon,
  percent: PercentIcon,
  mountains: MountainsIcon,
  scroll: ScrollIcon,
  strategy: StrategyIcon,
  door: DoorOpenIcon,
  phone: PhoneIcon,
  send: PaperPlaneTiltIcon,
  chartBar: ChartBarIcon,
  database: DatabaseIcon,
  userSwitch: UserSwitchIcon,
  chat: ChatCircleDotsIcon,
  fire: FireIcon,
  brain: BrainIcon,
  clock: ClockIcon,
  calendar: CalendarBlankIcon,
  storefront: StorefrontIcon,
  device: DeviceMobileIcon,
  sparkle: LightbulbIcon,
  coins: CoinsIcon,
  gift: GiftIcon,
  sun: SunIcon,
  umbrella: UmbrellaIcon,
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorName;
  filled?: boolean;
}

export function Icon({ name, size = 22, color = 'textPrimary', filled = false }: IconProps) {
  const { colors } = useTheme();
  const Glyph = ICONS[name];
  return <Glyph size={size} color={colors[color]} weight={filled ? 'fill' : 'regular'} />;
}
