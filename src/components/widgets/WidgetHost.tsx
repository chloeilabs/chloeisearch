import type { Widget } from '../../lib/widgets';
import Calculator from './Calculator';
import ColorPicker from './ColorPicker';
import RandomWidget from './RandomWidget';
import TimeWidget from './TimeWidget';
import TipCalculator from './TipCalculator';

/** Renders the interactive instant-answer widget for a detected query. */
export default function WidgetHost({ widget }: { widget: Widget }) {
  switch (widget.kind) {
    case 'calculator':
      return <Calculator seed={widget.seed} />;
    case 'color-picker':
      return <ColorPicker />;
    case 'coin':
      return <RandomWidget kind="coin" />;
    case 'dice':
      return <RandomWidget kind="dice" count={widget.count} sides={widget.sides} />;
    case 'random':
      return <RandomWidget kind="random" min={widget.min} max={widget.max} />;
    case 'timer':
      return <TimeWidget mode="timer" seconds={widget.seconds} />;
    case 'stopwatch':
      return <TimeWidget mode="stopwatch" />;
    case 'tip':
      return <TipCalculator />;
  }
}
