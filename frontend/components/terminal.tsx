import Preact, {Component} from "preact";
import "./terminal.scss";

export default class Terminal extends Component<{}, {messages: string[]}> {
    state = {messages: []};

    renderMessage(message: string, index: number) {
        return (
            <span class="terminal-message" key={`message--${index}`}>
                {message}
            </span>
        );
    }

    render(_, {messages}) {
        return (
            <div class="terminal">
                {messages.map(this.renderMessage)}
            </div>
        );
    }

    // API
    send(message: string) {
        this.setState(prev => ({messages: prev.messages.concat(message)}));
    }
}