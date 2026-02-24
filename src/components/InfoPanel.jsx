import React from 'react'

export default function InfoPanel() {
  return (
    <div className="info-panel">
      <div className="info-card" style={{ animationDelay: '0.1s' }}>
        <h1>[Tu Nombre]</h1>
        <p className="subtitle">Desarrollador Full Stack</p>
        <div className="tags">
          <span className="tag">React</span>
          <span className="tag">Node.js</span>
          <span className="tag">Python</span>
          <span className="tag">TypeScript</span>
          <span className="tag">Three.js</span>
          <span className="tag">AWS</span>
          <span className="tag">Docker</span>
          <span className="tag">SQL</span>
        </div>
      </div>

      <div className="info-card" style={{ animationDelay: '0.3s' }}>
        <h2>Experiencia</h2>
        <ul>
          <li>
            <span>Full Stack Developer @ Empresa</span>
            <span className="period">2022 - Presente</span>
          </li>
          <li>
            <span>Frontend Developer @ Startup</span>
            <span className="period">2020 - 2022</span>
          </li>
          <li>
            <span>Prácticas Desarrollo Web</span>
            <span className="period">2019 - 2020</span>
          </li>
        </ul>
      </div>

      <div className="info-card" style={{ animationDelay: '0.5s' }}>
        <h2>Educación</h2>
        <ul>
          <li>
            <span>Grado Ing. Informática</span>
            <span className="period">2015 - 2019</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
