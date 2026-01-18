/**
 * MapReadyContext
 * Context for communicating map ready state to loading screen
 */

import { createContext, useContext } from 'react';

export const MapReadyContext = createContext(null);
export const useMapReadyCallback = () => useContext(MapReadyContext);
