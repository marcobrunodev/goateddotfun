import './styles.css'
import arrow from '../../assets/arrow.svg'

export const Button = ({children, onClick, withArrow = false}: {children: string, onClick: () => void, withArrow?: boolean}) => (
  <button className="button" onClick={onClick}>
    {children}
    {withArrow && <img src={arrow} alt="Arrow icon" />}
  </button>
)