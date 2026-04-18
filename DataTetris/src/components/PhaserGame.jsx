import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import MainScene from '../game/MainScene';

const PhaserGame = ({ onScoreChange, onLinesChange, onSpeedChange, difficulty }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#0a0a14',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: null
    };

    const game = new Phaser.Game(config);

    // Communicate score changes from Phaser to React
    const setupListener = (scene) => {
        scene.events.on('score-changed', (score, combo) => {
            if (onScoreChange) onScoreChange(score, combo);
        });
        scene.events.on('integrity-changed', (integrity) => {
            if (window.onIntegrityChange) window.onIntegrityChange(integrity);
        });
        scene.events.on('game-over', (finalScore) => {
            if (window.onGameOver) window.onGameOver(finalScore);
        });
        scene.events.on('lines-changed', (lines) => {
            if (onLinesChange) onLinesChange(lines);
        });
        scene.events.on('speed-changed', (speed) => {
            if (onSpeedChange) onSpeedChange(speed);
        });
    };

    // Wait for engine to be ready, then add and start the scene manually
    game.events.on('ready', () => {
        game.registry.set('difficulty', difficulty);
        game.scene.add('MainScene', MainScene, true, { difficulty });
        
        // Short delay to ensure scene is active
        setTimeout(() => {
            const scene = game.scene.getScene('MainScene');
            if (scene) setupListener(scene);
        }, 50);
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="phaser-container">
        <div ref={gameRef} className="phaser-canvas-wrapper" />
    </div>
  );
};

export default PhaserGame;
