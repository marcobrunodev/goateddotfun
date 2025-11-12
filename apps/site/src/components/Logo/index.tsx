import logo from '../../assets/logo.svg'
import './styles.css'

export const Logo = ({withlabel = false}: {withlabel?: boolean}) => (
  <figure className="logo">
    <img src={logo} alt="Goated Logo" />
    {withlabel && <figcaption>goated</figcaption>}
  </figure>
)