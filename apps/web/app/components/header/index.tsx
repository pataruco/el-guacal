import { Link } from "react-router";

const Header = () => {
  return (
    <header>
      <h1>El Guacal</h1>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/auth/login">Login</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
