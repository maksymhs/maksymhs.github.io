import React from 'react'

export default function BookshelfOverlay({ book, onClose }) {
  if (!book) return null

  return (
    <div className="book-modal-backdrop" onClick={onClose}>
      <div
        className="book-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: book.color }}
      >
        <button className="book-modal-close" onClick={onClose}>✕</button>
        <div className="book-modal-accent" style={{ background: book.color }} />
        <h2 className="book-modal-title" style={{ color: book.color }}>{book.title}</h2>
        <p className="book-modal-subtitle">{book.subtitle}</p>
        <div className="book-modal-details">
          {book.details.split('\n').map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </div>
      </div>
    </div>
  )
}
