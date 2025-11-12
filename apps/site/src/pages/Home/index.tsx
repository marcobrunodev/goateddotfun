import { Button } from "../../components/Button"
import { Logo } from "../../components/Logo"
import { Title } from "../../components/Title"
import './styles.css'

function Home() {
  return (
    <>
      <header className="home-header">
        <Logo withlabel />
      </header>

      <main className="home-main">
        <Title>The timeline has a treasury now.</Title>
        <Button withArrow onClick={() => alert('Clicked!')}>
          Get started
        </Button>
      </main>
    </>
  )
}

export default Home