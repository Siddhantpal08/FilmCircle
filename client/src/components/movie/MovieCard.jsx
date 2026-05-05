import { Link } from 'react-router-dom';

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%2313131f'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%237c5cfc' font-size='30'%3E🎬%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' fill='%237c5cfc' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function MovieCard({ movie, indie = false }) {
    const id = movie.imdbID || movie._id;
    let poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : (movie.posterUrl || FALLBACK);
    if (poster.startsWith('http://')) poster = poster.replace('http://', 'https://');
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
        .movie-card { display: flex; flex-direction: column; overflow: hidden; background: var(--clr-surface); border-radius: var(--radius-sm); border: 1px solid var(--clr-border); transition: transform 0.2s, border-color 0.2s; width: 160px; height: 320px; flex-shrink: 0; }
        .poster-wrap { width: 100%; height: 240px; position: relative; background: var(--clr-surface-2); overflow: hidden; flex-shrink: 0; border-bottom: 1px solid var(--clr-border); }
        .movie-poster { width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.4s ease; display: block; }
        .movie-card:hover .movie-poster { transform: scale(1.06); }
        .movie-card:hover { border-color: var(--clr-primary); transform: translateY(-4px); }
        .indie-badge { position: absolute; top: 0.4rem; left: 0.4rem; background: rgba(46,204,113,0.85); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); z-index: 2; }
        .movie-card-body { padding: 0.6rem 0.75rem; display: flex; flex-direction: column; height: 80px; overflow: hidden; }
        .movie-card-title { font-size: 0.95rem; font-weight: 600; line-height: 1.2; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--clr-text); }
        .movie-card-year, .movie-card-genre { font-size: 0.78rem; color: var(--clr-text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
        </Link>
    );
}
