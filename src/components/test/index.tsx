import { useState } from "react";

import { Button } from "@/components/ui/button";
import reactLogo from "@/assets/react.svg";
import viteLogo from "@/assets/vite.svg";
import shadcnLogo from "@/assets/shadcn.svg";

function Test() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex flex-row justify-center">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={shadcnLogo} className="logo react" alt="Shadcn logo" />
        </a>
      </div>
      <h1>
        <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer">
          Vite
        </a>
        <span> + </span>
        <a
          href="https://reactjs.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          React
        </a>
        <span> + </span>
        <a href="https://shadcn.dev/" target="_blank" rel="noopener noreferrer">
          ShadcnUI
        </a>
      </h1>
      <div className="card">
        <br />
        <div className="flex flex-row justify-center">
          <Button onClick={() => setCount((count) => count + 1)}>
            Increment
          </Button>
          <Button className="ml-2" onClick={() => setCount(0)}>
            Reset
          </Button>
        </div>
        <br />
        <br />
        <span>Count is {count}</span>
        <br />
        <br />
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default Test;
