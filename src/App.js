import { BrowserRouter, Switch, Route } from 'react-router-dom'

import module1 from 'components/module1'


import 'App.css';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path='/module1' component={module1}/>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
