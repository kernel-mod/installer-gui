import {createContext} from "preact";

const AppContext = createContext<{
    setPage: ({element: any, title: string}) => void;
    reset: () => void;
    currentPage: {element: any, title: string}
}>(null);

export default AppContext;