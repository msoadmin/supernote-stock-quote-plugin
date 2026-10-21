import {AppRegistry, Image} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {PluginManager} from 'sn-plugin-lib';
import {buttonPressed, LASSO_BUTTON} from './src/buttons';

AppRegistry.registerComponent(appName, () => App);
PluginManager.init();

const icon = Image.resolveAssetSource(require('./assets/icon/icon.png')).uri;

PluginManager.registerButton(2, ['NOTE'], {
  id: LASSO_BUTTON,
  name: 'Stock Quote',
  icon,
  editDataTypes: [0, 3],
  showType: 1,
});

PluginManager.registerButtonListener({
  onButtonPress: event => buttonPressed(event?.id),
});
