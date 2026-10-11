import { ArrowDownRightIcon as ArrowDownRight } from 'phosphor-react-native/src/icons/ArrowDownRight';
import { ArrowRightIcon as ArrowRight } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArrowUpRightIcon as ArrowUpRight } from 'phosphor-react-native/src/icons/ArrowUpRight';
import { BuildingsIcon as Buildings } from 'phosphor-react-native/src/icons/Buildings';
import { CaretLeftIcon as CaretLeft } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon as CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckIcon as Check } from 'phosphor-react-native/src/icons/Check';
import { ClockCounterClockwiseIcon as ClockCounterClockwise } from 'phosphor-react-native/src/icons/ClockCounterClockwise';
import { CubeIcon as Cube } from 'phosphor-react-native/src/icons/Cube';
import { GearSixIcon as GearSix } from 'phosphor-react-native/src/icons/GearSix';
import { GlobeHemisphereWestIcon as GlobeHemisphereWest } from 'phosphor-react-native/src/icons/GlobeHemisphereWest';
import { InfoIcon as Info } from 'phosphor-react-native/src/icons/Info';
import { LockSimpleIcon as LockSimple } from 'phosphor-react-native/src/icons/LockSimple';
import { NewspaperIcon as Newspaper } from 'phosphor-react-native/src/icons/Newspaper';
import { PlusIcon as Plus } from 'phosphor-react-native/src/icons/Plus';
import { ShareNetworkIcon as ShareNetwork } from 'phosphor-react-native/src/icons/ShareNetwork';
import { UsersThreeIcon as UsersThree } from 'phosphor-react-native/src/icons/UsersThree';
import { WalletIcon as Wallet } from 'phosphor-react-native/src/icons/Wallet';
import { WarningIcon as Warning } from 'phosphor-react-native/src/icons/Warning';
import { XIcon as X } from 'phosphor-react-native/src/icons/X';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';

const ICONS = {
  feed: Newspaper,
  product: Cube,
  people: UsersThree,
  money: Wallet,
  world: GlobeHemisphereWest,
  company: Buildings,
  settings: GearSix,
  close: X,
  next: CaretRight,
  back: CaretLeft,
  forward: ArrowRight,
  locked: LockSimple,
  warning: Warning,
  check: Check,
  up: ArrowUpRight,
  down: ArrowDownRight,
  history: ClockCounterClockwise,
  share: ShareNetwork,
  add: Plus,
  info: Info,
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorName;
  filled?: boolean;
}

/** The single icon set (Phosphor), in regular weight; filled for selected states. */
export function Icon({ name, size = 22, color = 'textPrimary', filled = false }: IconProps) {
  const { colors } = useTheme();
  const Glyph = ICONS[name];
  return <Glyph size={size} color={colors[color]} weight={filled ? 'fill' : 'regular'} />;
}
