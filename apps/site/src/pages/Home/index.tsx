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
        
        <div className="container">
          <p>
            Everyone runs raffles, tags frens, boosts posts.
          </p>
          <p>
            That energy shouldn’t be free.
          </p>
          <p>
            We turn grind into payoff. Posts become pools, everyone eats.
          </p>
          <p>
            Same chaos. Now it pays.
          </p>
        </div>

        <Button withArrow onClick={() => alert('Clicked!')}>
          Get started
        </Button>
      </main>
    </>
  )
}

export default Home