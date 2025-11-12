import logo from '../../assets/logo.svg'
import goated from '../../assets/goated.svg'
import './styles.css'

export const Logo = ({withlabel = false}: {withlabel?: boolean}) => (
  <figure className="logo">
    <img src={logo} alt="Goated Logo" />
    {withlabel && <img src={goated} alt="Goated Label" />}
  </figure>
)