import { Link } from 'react-router-dom';

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%2313131f'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%237c5cfc' font-size='30'%3E🎬%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' fill='%237c5cfc' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function MovieCard({ movie, indie = false }) {
    const id = movie.imdbID || movie._id;
    const poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : (movie.posterUrl || FALLBACK);
    const title = movie.Title || movie.title;
    const year = movie.Year || movie.year || '';
    const genre = movie.Genre || movie.genre || '';

    return (
        <Link to={`/movie/${id}`} className="card movie-card">
            <div className="poster-wrap">
                <img src={poster} alt={title} className="movie-poster" onError={e => { e.target.src = FALLBACK; }} loading="lazy" />
                {indie && <span className="indie-badge">🎬 Indie</span>}
            </div>
            <div className="movie-card-body">
                <h3 className="movie-card-title">{title}</h3>
                {year && <p className="movie-card-year">{year}</p>}
                {genre && <p className="movie-card-genre">{genre.split(',')[0].trim()}</p>}
            </div>
            <style>{`
        .movie-card { display: flex; flex-direction: column; overflow: hidden; }
        .poster-wrap { position: relative; aspect-ratio: 2/3; background: var(--clr-surface-2); overflow: hidden; }
        .movie-poster { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
        .movie-card:hover .movie-poster { transform: scale(1.06); }
        .indie-badge { position: absolute; top: 0.4rem; left: 0.4rem; background: rgba(46,204,113,0.85); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); }
        .movie-card-body { padding: 0.75rem; }
        .movie-card-title { font-size: 0.95rem; font-weight: 600; line-height: 1.3; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--clr-text); }
        .movie-card-year, .movie-card-genre { font-size: 0.78rem; color: var(--clr-text-muted); margin: 0; }
      `}</style>
        </Link>
    );
}
