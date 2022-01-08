import Store from "../modules/store";
import Preact, {Component} from "preact";
import Close from "./icons/close";
import "./notifications.scss";

export type StoreNotification = {content: string, id: string};

const NotificationsStore = new class NotificationsStore extends Store {
    notifications: StoreNotification[] = [];

    closeNotification(id: string) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index < 0) return false;

        this.notifications.splice(index, 1);
        this.emitChange();
    }

    showNotification(content: string) {
        this.notifications.push({content, id: Math.random().toString(36).slice(0, 8)});
        this.emitChange();
    }
}

export class Notification extends Component<{content: string, id: string}> {
    state = {closing: false};

    timeout: NodeJS.Timeout;

    handleClose = () => {
        this.setState({closing: true}, () => {
            setTimeout(() => {
                NotificationsStore.closeNotification(this.props.id);
            }, 400);
        });
    }

    componentDidMount() {this.startTimeout();}

    startTimeout() {
        this.timeout = setTimeout(() => {
            this.handleClose();
        }, 5000);
    }

    onMouseEnter = () => {
        clearTimeout(this.timeout);
    } 

    onMouseLeave = () => {
        this.startTimeout();
    }

    render({content}, {closing}) {
        return (
            <div
                class={`notification${closing ? " closing" : ""}`}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
            >
                <div class="content">{content}</div>
                <div class="close-button" onClick={this.handleClose}>
                    <Close width="16" height="16" />
                </div>
            </div>  
        );
    }
}

export class Notifications extends Component {
    componentDidMount(): void {
        NotificationsStore.addListener(this.handleUpdate);
    }

    componentWillUnmount(): void {
        NotificationsStore.removeListener(this.handleUpdate);
    }

    handleUpdate = (): void => {this.forceUpdate();}

    renderNotifications() {
        return NotificationsStore.notifications.map(notification => (
            <Notification key={notification.id} {...notification} />
        ));
    }

    render() {
        return (
            <div class="notifications">
                {this.renderNotifications()}
            </div>
        );
    }
}

export default NotificationsStore;