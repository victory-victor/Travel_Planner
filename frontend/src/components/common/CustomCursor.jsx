import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './CustomCursor.css';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    // Hide default cursor
    document.body.style.cursor = 'none';

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    // Track mouse movement
    const onMouseMove = (e) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' });
    };

    // Event delegation for interactive elements
    const onMouseOver = (e) => {
      if (e.target.closest('a, button, input, textarea, select, .card, .interactive')) {
        gsap.to(follower, { 
          scale: 1, 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderColor: 'transparent',
          backdropFilter: 'blur(0px)',
          duration: 0.2 
        });
        gsap.to(cursor, { scale: 1, duration: 0.2 });
      }
    };

    const onMouseOut = (e) => {
      if (e.target.closest('a, button, input, textarea, select, .card, .interactive')) {
        gsap.to(follower, { 
          scale: 1, 
          backgroundColor: 'transparent', 
          borderColor: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(0px)',
          duration: 0.2 
        });
        gsap.to(cursor, { scale: 1, duration: 0.2 });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseover', onMouseOver);
    document.body.addEventListener('mouseout', onMouseOut);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', onMouseMove);
      document.body.removeEventListener('mouseover', onMouseOver);
      document.body.removeEventListener('mouseout', onMouseOut);
    };
  }, []);

  return (
    <>
      <div className="custom-cursor" ref={cursorRef} />
      <div className="custom-cursor-follower" ref={followerRef} />
    </>
  );
};

export default CustomCursor;
