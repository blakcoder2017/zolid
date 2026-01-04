import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';

const RouterWithFutureFlags = ({ children }) => {
    useEffect(() => {
        // Enable React Router v7 future flags to suppress warnings
        if (typeof window !== 'undefined') {
            // These flags opt into the v7 behavior early
            window.__react_router_future_flags__ = {
                v7_startTransition: true,
                v7_relativeSplatPath: true
            };
        }
    }, []);

    return (
        <BrowserRouter future={{ 
            v7_startTransition: true,
            v7_relativeSplatPath: true 
        }}>
            {children}
        </BrowserRouter>
    );
};

export default RouterWithFutureFlags;