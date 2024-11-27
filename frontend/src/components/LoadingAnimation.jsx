import Lottie from 'lottie-react';
import votingAnimation from '../assets/voting-animation.json';

export function LoadingAnimation() {
  return (
    <div className="loading-animation">
      <Lottie
        animationData={votingAnimation}
        loop={true}
        style={{ width: 200, height: 200 }}
      />
    </div>
  );
} 