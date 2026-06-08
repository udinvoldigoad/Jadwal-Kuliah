import { useCallback, useMemo, useState } from 'react';
import { PageActionContext } from '../contexts/PageActionContext.js';

export default function PageActionProvider({ children }) {
    const [pageAction, setPageActionState] = useState(null);

    const setPageAction = useCallback((action) => {
        setPageActionState(action);
    }, []);

    const value = useMemo(() => ({
        pageAction,
        setPageAction,
    }), [pageAction, setPageAction]);

    return (
        <PageActionContext.Provider value={value}>
            {children}
        </PageActionContext.Provider>
    );
}
