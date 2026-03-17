import { H1, Sub, SecTitle, P } from '../Win95Window.jsx';
import { SANS } from '../theme.js';

const Photo = ({ src, caption, float }) => (
  <div style={{
    float, width: 121, margin: float === 'right' ? '0 0 8px 12px' : '0 12px 8px 0',
  }}>
    <img src={src} alt={caption} style={{ width: '100%', display: 'block' }} />
    <div style={{ fontFamily: SANS, fontSize: 8, color: '#666', marginTop: 2, fontStyle: 'italic', textAlign: 'center' }}>
      {caption}
    </div>
  </div>
);

const AboutPage = () => (
  <div style={{ padding: '24px 20px 16px' }}>
    <H1>About Me</H1>
    <Sub>Background, interests, and what drives me</Sub>

    <div>
      <Photo src="/dolores.jpeg" caption="Me at Dolores Park, SF" float="right" />
      <P>
        I am a software engineer from India, based in Pittsburgh. I recently graduated with my
        MS in Information Systems from Carnegie Mellon University and I am genuinely excited
        about what comes next.
      </P>
      <P>
        I got into engineering and that is what led me to programming. I discovered web development
        through The Odin Project, classic late-night tinkering that turned into something I could
        not stop. While I am comfortable across the stack, frontend is where I feel most at home.
        I care deeply about the details of how things look and feel, the kind of craft most people
        will not consciously notice but everyone will experience.
      </P>
      <div style={{ clear: 'both' }} />
    </div>

    <SecTitle>Outside of Work</SecTitle>
    <div>
      <Photo src="/painting.jpeg" caption="A painting I made" float="left" />
      <P>
        I paint mostly on canvas and sketchbook, occasionally digital. There is something about
        working with your hands that resets the part of the brain that stares at screens all day.
        Lately I have been getting into film photography too, still figuring it out but that is
        half the fun.
      </P>
      <P>
        I also{' '}
        <a
          href="https://www.strava.com/athletes/32398996"
          target="_blank" rel="noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          run
        </a>
        . For my 26th birthday I ran 26km, which felt poetic at the time and deeply
        questionable by kilometre 22. I explore new trails whenever I am somewhere new, it is the
        best way I know to actually see a place. I have also been reading more lately, mostly
        non-fiction.
      </P>
      <div style={{ clear: 'both' }} />
    </div>
  </div>
);

export default AboutPage;
