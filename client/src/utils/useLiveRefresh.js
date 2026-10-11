import { useEffect, useRef } from 'react';
import { createSocket } from '../socket';

/*
  Calls `reload` whenever the server says "donations:changed"
  (new food added, claimed, picked up, delivered...).
  This keeps every dashboard up to date without refreshing the page.
*/
export default function useLiveRefresh(reload) {
  const reloadRef = useRef(reload);
  reloadRef.current = reload; // always call the latest version of the function

  useEffect(() => {
    const socket = createSocket();
    socket.on('donations:changed', () => reloadRef.current());
    return () => socket.disconnect();
  }, []);
}
