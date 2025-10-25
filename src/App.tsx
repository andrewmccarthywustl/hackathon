import Chat from './components/Chat';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>🔬 Researcher Chat</h1>
        <p>Ask about papers, find researchers, or explore your field - AI automatically helps with the right tools</p>
      </header>

      <div className="main-content">
        <Chat />
      </div>
    </div>
  );
}

export default App;
