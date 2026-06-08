import { createContext, useContext, useEffect } from 'react';

export const PageActionContext = createContext(null);

export function usePageAction() {
    const context = useContext(PageActionContext);
    if (!context) {
        throw new Error('usePageAction must be used within a PageActionProvider');
    }
    return context;
}

export function usePageActionRegistration(action) {
    const { setPageAction } = usePageAction();

    useEffect(() => {
        setPageAction(action ?? null);
        return () => setPageAction(null);
    }, [action, setPageAction]);
}
