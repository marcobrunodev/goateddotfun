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
            Everyone here runs raffles, tags frens, boosts posts and keeps the feed spinning. That energy shouldn’t be free.<br/>
            We turn the grind into payoff. 
          </p>
          <p>
            Your posts become pools. Your participants get a stake. Everyone eats when the timeline moves.
          </p>
          <p>
            Same raffles. Same chaos. Now it pays.
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