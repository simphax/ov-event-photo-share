import turtle from "../turtle_walk.gif";
import "./TurtleAnimation.css";

export const Turtle = () => {
  return (
    <div className="relative">
      <img alt="turtle" className="w-8 absolute turtle-walk" src={turtle} />
    </div>
  );
};
