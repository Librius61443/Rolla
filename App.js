import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainContainer from './navigation/MainContainer';
// import TestIcon from './navigation/TestIcons';
// import NotificationsHandler from './notifications/notificationsHandler';
// import { useEffect } from 'react';

function App() {
  // useEffect(() => {
  //   notificationsHandler(); // call your setup logic once
  // }, []);

  return (
    <GestureHandlerRootView>
      <>
        <MainContainer />
        {/* <TestIcon /> */}
        {/* <NotificationsHandler /> */}
      </>
    </GestureHandlerRootView>
    // <TestIcon />

  );
}

export default App;