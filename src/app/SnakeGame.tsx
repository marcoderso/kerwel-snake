"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CELL_SIZE = 20;
const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const INITIAL_SPEED = 150;
const SWIPE_THRESHOLD = 30;

type Position = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

type SnakeGameProps = {
  onScoreSubmit?: () => void;
};

export default function SnakeGame({ onScoreSubmit }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 15, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 20, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  const directionRef = useRef<Direction>(direction);
  const headImageRef = useRef<HTMLImageElement | null>(null);
  const foodImageRef = useRef<HTMLImageElement | null>(null);
  const imagesLoaded = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load images
  useEffect(() => {
    const headImg = new Image();
    const foodImg = new Image();

    headImg.onload = () => {
      headImageRef.current = headImg;
      checkImagesLoaded();
    };
    foodImg.onload = () => {
      foodImageRef.current = foodImg;
      checkImagesLoaded();
    };

    headImg.src = "/Kerwel.png";
    foodImg.src = "/IGBCE.png";

    function checkImagesLoaded() {
      if (headImageRef.current && foodImageRef.current) {
        imagesLoaded.current = true;
      }
    }
  }, []);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => setIsTouchDevice(true);
    window.addEventListener("touchstart", checkTouch, { once: true });
    // Also check via media query
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
    }
    return () => window.removeEventListener("touchstart", checkTouch);
  }, []);

  // Responsive canvas scaling
  useEffect(() => {
    const updateScale = () => {
      const maxWidth = window.innerWidth - 32; // 16px padding each side
      const canvasWidth = GRID_WIDTH * CELL_SIZE;
      if (maxWidth < canvasWidth) {
        setCanvasScale(maxWidth / canvasWidth);
      } else {
        setCanvasScale(1);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      };
    } while (
      currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 15, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
    setShowNameInput(false);
    setScoreSubmitted(false);
  }, [generateFood]);

  const submitScore = useCallback(async () => {
    if (!playerName.trim() || score <= 0 || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName.trim(), score }),
      });

      if (res.ok) {
        setScoreSubmitted(true);
        setShowNameInput(false);
        onScoreSubmit?.();
      }
    } catch (err) {
      console.error("Failed to submit score:", err);
    } finally {
      setSubmitting(false);
    }
  }, [playerName, score, submitting, onScoreSubmit]);

  // Touch swipe controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (showNameInput) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (showNameInput) return;
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // If swipe is too short, treat as tap
      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
        if (!gameStarted && !gameOver) {
          resetGame();
        } else if (gameOver && !showNameInput) {
          resetGame();
        }
        touchStartRef.current = null;
        return;
      }

      const currentDir = directionRef.current;

      if (absDx > absDy) {
        if (dx > 0 && currentDir !== "LEFT") {
          setDirection("RIGHT");
          directionRef.current = "RIGHT";
        } else if (dx < 0 && currentDir !== "RIGHT") {
          setDirection("LEFT");
          directionRef.current = "LEFT";
        }
      } else {
        if (dy > 0 && currentDir !== "UP") {
          setDirection("DOWN");
          directionRef.current = "DOWN";
        } else if (dy < 0 && currentDir !== "DOWN") {
          setDirection("UP");
          directionRef.current = "UP";
        }
      }

      touchStartRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameStarted && !gameOver) {
        e.preventDefault();
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gameStarted, gameOver, showNameInput, resetGame]);

  // Prevent body scroll on mobile while game is active
  useEffect(() => {
    if (!isTouchDevice) return;

    const preventScroll = (e: TouchEvent) => {
      if (gameStarted && !gameOver) {
        const target = e.target as HTMLElement;
        if (target.closest("[data-game-area]")) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [gameStarted, gameOver, isTouchDevice]);

  // D-Pad button handler
  const handleDpadPress = useCallback(
    (newDirection: Direction) => {
      if (!gameStarted && !gameOver) {
        resetGame();
        return;
      }
      if (gameOver) {
        resetGame();
        return;
      }

      const currentDir = directionRef.current;
      const opposites: Record<Direction, Direction> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      if (opposites[newDirection] !== currentDir) {
        setDirection(newDirection);
        directionRef.current = newDirection;
      }
    },
    [gameStarted, gameOver, resetGame]
  );

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle game keys when name input is shown
      if (showNameInput) return;

      if (!gameStarted && !gameOver) {
        if (e.key === " " || e.key === "Enter") {
          resetGame();
          return;
        }
      }

      if (gameOver) {
        if (e.key === " " || e.key === "Enter") {
          resetGame();
          return;
        }
      }

      const currentDir = directionRef.current;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (currentDir !== "DOWN") {
            setDirection("UP");
            directionRef.current = "UP";
          }
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (currentDir !== "UP") {
            setDirection("DOWN");
            directionRef.current = "DOWN";
          }
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (currentDir !== "RIGHT") {
            setDirection("LEFT");
            directionRef.current = "LEFT";
          }
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (currentDir !== "LEFT") {
            setDirection("RIGHT");
            directionRef.current = "RIGHT";
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStarted, gameOver, resetGame, showNameInput]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDirection = directionRef.current;

        switch (currentDirection) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
        }

        // Check wall collision
        if (
          head.x < 0 ||
          head.x >= GRID_WIDTH ||
          head.y < 0 ||
          head.y >= GRID_HEIGHT
        ) {
          setGameOver(true);
          setHighScore((prev) => Math.max(prev, score));
          return prevSnake;
        }

        // Check self collision
        if (
          prevSnake.some(
            (segment) => segment.x === head.x && segment.y === head.y
          )
        ) {
          setGameOver(true);
          setHighScore((prev) => Math.max(prev, score));
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((prev) => prev + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, INITIAL_SPEED - Math.min(score, 100));

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, food, score, generateFood]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0f0f23";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = "#1a1a3a";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food (IGBCE logo)
    if (foodImageRef.current) {
      ctx.drawImage(
        foodImageRef.current,
        food.x * CELL_SIZE,
        food.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    } else {
      ctx.fillStyle = "#e94560";
      ctx.fillRect(
        food.x * CELL_SIZE,
        food.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    }

    // Draw snake body
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Draw head with Kerwel image
        if (headImageRef.current) {
          ctx.save();
          const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
          const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
          ctx.translate(centerX, centerY);

          // Rotate based on direction
          let rotation = 0;
          switch (directionRef.current) {
            case "UP":
              rotation = -Math.PI / 2;
              break;
            case "DOWN":
              rotation = Math.PI / 2;
              break;
            case "LEFT":
              rotation = Math.PI;
              break;
            case "RIGHT":
              rotation = 0;
              break;
          }
          ctx.rotate(rotation);

          // Draw circular clipped image
          ctx.beginPath();
          ctx.arc(0, 0, CELL_SIZE / 2, 0, Math.PI * 2);
          ctx.clip();

          ctx.drawImage(
            headImageRef.current,
            -CELL_SIZE / 2,
            -CELL_SIZE / 2,
            CELL_SIZE,
            CELL_SIZE
          );
          ctx.restore();
        } else {
          ctx.fillStyle = "#4ecca3";
          ctx.beginPath();
          ctx.arc(
            segment.x * CELL_SIZE + CELL_SIZE / 2,
            segment.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      } else {
        // Draw body segments with gradient
        const gradient = ctx.createRadialGradient(
          segment.x * CELL_SIZE + CELL_SIZE / 2,
          segment.y * CELL_SIZE + CELL_SIZE / 2,
          0,
          segment.x * CELL_SIZE + CELL_SIZE / 2,
          segment.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 2
        );
        gradient.addColorStop(0, "#4ecca3");
        gradient.addColorStop(1, "#2d8a6e");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          segment.x * CELL_SIZE + CELL_SIZE / 2,
          segment.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 2 - 1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    });

    // Draw start screen
    if (!gameStarted && !gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("KERWEL SNAKE", canvas.width / 2, canvas.height / 2 - 40);

      ctx.font = "18px Arial";
      ctx.fillStyle = "#4ecca3";
      ctx.fillText(
        isTouchDevice ? "Tippe um zu starten" : "Drücke Enter um zu starten",
        canvas.width / 2,
        canvas.height / 2 + 10
      );

      ctx.font = "14px Arial";
      ctx.fillStyle = "#888";
      ctx.fillText(
        isTouchDevice
          ? "Wische oder benutze die Buttons zum steuern"
          : "Benutze Pfeiltasten oder WASD zum steuern",
        canvas.width / 2,
        canvas.height / 2 + 50
      );
    }

    // Draw game over screen (basic overlay, detailed UI rendered via React)
    if (gameOver && !showNameInput) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#e94560";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Arial";
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 15);

      if (highScore > 0) {
        ctx.fillStyle = "#ffd700";
        ctx.font = "18px Arial";
        ctx.fillText(
          `High Score: ${highScore}`,
          canvas.width / 2,
          canvas.height / 2 + 20
        );
      }

      if (!scoreSubmitted && score > 0) {
        ctx.fillStyle = "#4ecca3";
        ctx.font = "16px Arial";
        ctx.fillText(
          isTouchDevice
            ? "'Score speichern' oder tippe zum Neustarten"
            : "Klicke 'Score speichern' oder Enter zum Neustarten",
          canvas.width / 2,
          canvas.height / 2 + 70
        );
      } else {
        ctx.fillStyle = "#4ecca3";
        ctx.font = "16px Arial";
        ctx.fillText(
          isTouchDevice
            ? "Tippe um neu zu starten"
            : "Drücke Enter um neu zu starten",
          canvas.width / 2,
          canvas.height / 2 + 70
        );
      }
    }

    if (showNameInput) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [snake, food, gameOver, gameStarted, score, highScore, showNameInput, scoreSubmitted, isTouchDevice]);

  const dpadButtonStyle = (active?: boolean): React.CSSProperties => ({
    width: "56px",
    height: "56px",
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#0f0f23",
    backgroundColor: active ? "#3db88e" : "#4ecca3",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  });

  return (
    <div
      ref={containerRef}
      data-game-area
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        maxWidth: `${GRID_WIDTH * CELL_SIZE + 6}px`,
      }}
    >
      <h1
        style={{
          color: "#4ecca3",
          fontSize: "clamp(1.3rem, 5vw, 2rem)",
          textShadow: "0 0 10px rgba(78, 204, 163, 0.5)",
        }}
      >
        Kerwel Snake
      </h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          color: "#fff",
          fontSize: "clamp(0.9rem, 3vw, 1.2rem)",
        }}
      >
        <span>
          Score: <strong style={{ color: "#4ecca3" }}>{score}</strong>
        </span>
        {highScore > 0 && (
          <span>
            High Score: <strong style={{ color: "#ffd700" }}>{highScore}</strong>
          </span>
        )}
      </div>

      <div
        style={{
          position: "relative",
          width: `${GRID_WIDTH * CELL_SIZE}px`,
          height: `${GRID_HEIGHT * CELL_SIZE}px`,
          transform: canvasScale < 1 ? `scale(${canvasScale})` : undefined,
          transformOrigin: "top center",
        }}
      >
        <canvas
          ref={canvasRef}
          width={GRID_WIDTH * CELL_SIZE}
          height={GRID_HEIGHT * CELL_SIZE}
          style={{
            border: "3px solid #4ecca3",
            borderRadius: "8px",
            boxShadow: "0 0 20px rgba(78, 204, 163, 0.3)",
            touchAction: "none",
          }}
        />

        {/* Save Score Button */}
        {gameOver && !scoreSubmitted && score > 0 && !showNameInput && (
          <button
            onClick={() => setShowNameInput(true)}
            style={{
              position: "absolute",
              left: "50%",
              top: "60%",
              transform: "translateX(-50%)",
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#0f0f23",
              backgroundColor: "#4ecca3",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(78, 204, 163, 0.5)",
            }}
          >
            Score speichern
          </button>
        )}

        {/* Name Input Modal */}
        {showNameInput && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "#1a1a2e",
              padding: "24px",
              borderRadius: "12px",
              border: "2px solid #4ecca3",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "center",
              boxShadow: "0 0 30px rgba(78, 204, 163, 0.3)",
              width: "min(280px, 90%)",
            }}
          >
            <h3 style={{ color: "#fff", margin: 0 }}>Score: {score}</h3>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && playerName.trim()) {
                  submitScore();
                }
              }}
              placeholder="Dein Name"
              maxLength={20}
              autoFocus
              style={{
                padding: "12px 16px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "2px solid #4ecca3",
                backgroundColor: "#0f0f23",
                color: "#fff",
                outline: "none",
                width: "100%",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={submitScore}
                disabled={!playerName.trim() || submitting}
                style={{
                  padding: "10px 20px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#0f0f23",
                  backgroundColor: playerName.trim() ? "#4ecca3" : "#666",
                  border: "none",
                  borderRadius: "6px",
                  cursor: playerName.trim() ? "pointer" : "not-allowed",
                }}
              >
                {submitting ? "..." : "Speichern"}
              </button>
              <button
                onClick={() => setShowNameInput(false)}
                style={{
                  padding: "10px 20px",
                  fontSize: "1rem",
                  color: "#fff",
                  backgroundColor: "transparent",
                  border: "2px solid #666",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spacer to account for scaled canvas height */}
      {canvasScale < 1 && (
        <div
          style={{
            height: `${GRID_HEIGHT * CELL_SIZE * (1 - canvasScale)}px`,
          }}
        />
      )}

      {/* On-screen D-Pad for touch devices */}
      {isTouchDevice && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "56px 56px 56px",
            gridTemplateRows: "56px 56px 56px",
            gap: "6px",
            marginTop: "4px",
          }}
        >
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleDpadPress("UP");
            }}
            style={dpadButtonStyle()}
            aria-label="Hoch"
          >
            &#9650;
          </button>
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleDpadPress("LEFT");
            }}
            style={dpadButtonStyle()}
            aria-label="Links"
          >
            &#9664;
          </button>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              backgroundColor: "#1a1a2e",
              border: "2px solid #2d8a6e",
            }}
          />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleDpadPress("RIGHT");
            }}
            style={dpadButtonStyle()}
            aria-label="Rechts"
          >
            &#9654;
          </button>
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleDpadPress("DOWN");
            }}
            style={dpadButtonStyle()}
            aria-label="Runter"
          >
            &#9660;
          </button>
          <div />
        </div>
      )}

      <div style={{ color: "#888", fontSize: "0.9rem", textAlign: "center" }}>
        Sammle die <span style={{ color: "#e94560" }}>IGBCE</span> Logos um zu wachsen!
      </div>
    </div>
  );
}
