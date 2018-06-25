import React, { Component } from 'react';

import dixitEngine from './dixitEngine';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor() {
    super();
    const viewModel = dixitEngine.homeViewModel();
    viewModel.state$.subscribe(this.setState);
    this.editCard = viewModel.mutations.editCard;
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
