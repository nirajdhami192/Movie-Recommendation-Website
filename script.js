const TMDB_API_KEY = 'e88d312798c8cd2d58a732a7b24fad79'; 

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const moviesList = document.getElementById('moviesList');
const genreBtns = document.querySelectorAll('.genre-btn');
const resultsTitle = document.getElementById('resultsTitle');
const yearFromInput = document.getElementById('yearFrom');
const yearToInput = document.getElementById('yearTo');
const minRatingSelect = document.getElementById('minRating');
const typeSelect = document.getElementById('type');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const homeButton = document.getElementById('homeButton');


let currentPage = 1;
let totalPages = 1;
let currentSearchQuery = '';
let currentSearchType = 'latest'; 


document.addEventListener('DOMContentLoaded', () => {
    fetchLatestMovies();

    const currentYear = new Date().getFullYear();
    yearToInput.value = currentYear;
    yearFromInput.value = currentYear - 5;
});


searchButton.addEventListener('click', () => {
    currentPage = 1;
    currentSearchType = 'search';
    searchMovies();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentPage = 1;
        currentSearchType = 'search';
        searchMovies();
    }
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchResults();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchResults();
    }
});


genreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        genreBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentPage = 1;
        currentSearchType = 'genre';
        currentSearchQuery = btn.dataset.genre;
        fetchMoviesByGenre(btn.dataset.genre);
        
        
        resultsTitle.textContent = `${btn.textContent} Movies`;
    });
});


homeButton.addEventListener('click', () => {
    currentPage = 1;
    currentSearchType = 'latest';
    fetchLatestMovies();

    genreBtns.forEach(b => b.classList.remove('active'));

    searchInput.value = '';

    resultsTitle.textContent = 'Latest Movies';
});


function fetchResults() {
    switch(currentSearchType) {
        case 'search':
            searchMovies();
            break;
        case 'genre':
            fetchMoviesByGenre(currentSearchQuery);
            break;
        case 'latest':
            fetchLatestMovies();
            break;
        default:
            fetchLatestMovies();
    }
}

async function searchMovies() {
    const query = searchInput.value.trim();

    if (query === "") {
        showError("Please enter a movie title");
        return;
    }
    let url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`;
    if (typeSelect.value) {
        url += `&include_adult=false&media_type=${typeSelect.value}`;
    } else {
        url += '&include_adult=false';
    }
    if (yearFromInput.value) {
        url += `&primary_release_year=${yearFromInput.value}`;
    }

    try {
        showLoading();
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors ? data.errors.join(', ') : 'No movies found');
        }
        
        totalPages = data.total_pages;
        updatePagination();

        resultsTitle.textContent = `Search Results for "${query}"`;
        
        displayMovies(data.results);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        displayNoResults();
    } finally {
        hideLoading();
    }
}


async function fetchMoviesByGenre(genreId) {
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${currentPage}`;

    if (yearFromInput.value) {
        url += `&primary_release_date.gte=${yearFromInput.value}-01-01`;
    }
    if (yearToInput.value) {
        url += `&primary_release_date.lte=${yearToInput.value}-12-31`;
    }

    if (minRatingSelect.value) {
        url += `&vote_average.gte=${minRatingSelect.value}`;
    }

    try {
        showLoading();
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors ? data.errors.join(', ') : 'No movies found in this genre');
        }
        
        totalPages = data.total_pages;
        updatePagination();
        
        displayMovies(data.results);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        displayNoResults();
    } finally {
        hideLoading();
    }
}

async function fetchLatestMovies() {
    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&page=${currentPage}`;

    try {
        showLoading();
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors ? data.errors.join(', ') : 'No latest movies found');
        }
        
        totalPages = data.total_pages;
        updatePagination();
        
        displayMovies(data.results);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        displayNoResults();
    } finally {
        hideLoading();
    }
}

function displayMovies(movies) {
    moviesList.innerHTML = '';

    if (!movies || movies.length === 0) {
        displayNoResults();
        return;
    }

    movies.forEach(movie => {
        const movieDiv = document.createElement('div');
        movieDiv.classList.add('movie');
        movieDiv.dataset.id = movie.id;

        const imageUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Poster';
            
        const title = movie.title || movie.name || 'Untitled';
        const releaseDate = movie.release_date || movie.first_air_date || 'N/A';
        const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
        const type = movie.media_type || (movie.title ? 'movie' : 'tv');
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

        movieDiv.innerHTML = `
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            <div class="movie-info">
                <h3>${title}</h3>
                <p>${year}</p>
                ${rating !== 'N/A' ? `<div class="star-rating">${convertToStars(rating)} (${rating})</div>` : ''}
                <p class="type">${type}</p>
            </div>
        `;

        movieDiv.addEventListener('click', () => {
            const type = movie.media_type || (movie.title ? 'movie' : 'tv');
            fetchMovieDetails(movie.id, type);
        });

        moviesList.appendChild(movieDiv);
    });
}

async function fetchMovieDetails(movieId, type) {
    const url = `https://api.themoviedb.org/3/${type}/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,similar`;

    try {
        showLoading();
        const response = await fetch(url);
        const movie = await response.json();
        
        if (!response.ok) {
            throw new Error(movie.errors ? movie.errors.join(', ') : 'Movie details not found');
        }
        
        displayMovieDetails(movie, type);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function displayMovieDetails(movie, type) {

    const existingModals = document.querySelectorAll('.movie-modal');
    existingModals.forEach(modal => modal.remove());

    const modal = document.createElement('div');
    modal.classList.add('movie-modal', 'active');

    const backdrop = document.createElement('div');
    backdrop.classList.add('modal-backdrop', 'active');
    document.body.appendChild(backdrop);

    const imageUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Poster';

    const backdropUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : '';

    const title = movie.title || movie.name || 'Untitled';
    const releaseDate = movie.release_date || movie.first_air_date || 'N/A';
    const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const overview = movie.overview || 'No description available.';
    
   
    const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A';

    const director = type === 'movie' && movie.credits 
        ? movie.credits.crew.find(person => person.job === 'Director')?.name 
        : 'N/A';
    
    const creator = type === 'tv' && movie.created_by?.length > 0
        ? movie.created_by.map(c => c.name).join(', ')
        : 'N/A';

    const trailer = movie.videos?.results?.find(video => 
        (video.type === 'Trailer' || video.type === 'Teaser') && video.site === 'YouTube'
    );

    const cast = movie.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'N/A';

 
    const similar = movie.similar?.results?.slice(0, 5) || [];

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            ${backdropUrl ? `<div class="movie-backdrop" style="background-image: url('${backdropUrl}')"></div>` : ''}
            <div class="modal-body">
                <div class="poster-col">
                    <img src="${imageUrl}" alt="${title}" class="movie-poster">
                </div>
                <div class="details-col">
                    <h2 class="movie-title">${title} <span class="release-year">(${year})</span></h2>
                    
                    <div class="movie-meta">
                        <span class="rating">${convertToStars(rating)} ${rating}/10</span>
                        <span class="type-badge">${type === 'movie' ? 'Movie' : 'TV Show'}</span>
                    </div>
                    
                    <div class="movie-info">
                        <div class="info-row">
                            <span class="info-label">${type === 'movie' ? 'Director:' : 'Creator:'}</span>
                            <span class="info-value">${type === 'movie' ? director : creator}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Genres:</span>
                            <span class="info-value">${genres}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Cast:</span>
                            <span class="info-value">${cast}</span>
                        </div>
                    </div>
                    
                    <div class="movie-overview">
                        <h3>Overview</h3>
                        <p>${overview}</p>
                    </div>
                    
                    ${trailer ? `
                    <button class="trailer-btn" data-youtube-id="${trailer.key}">
                        <i class="fas fa-play"></i> Watch Trailer
                    </button>
                    ` : ''}
                    
                    ${similar.length > 0 ? `
                    <div class="similar-movies">
                        <h3>Similar ${type === 'movie' ? 'Movies' : 'TV Shows'}</h3>
                        <div class="similar-movies-list">
                            ${similar.map(item => `
                                <div class="similar-movie" onclick="fetchMovieDetails(${item.id}, '${type}')">
                                    <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster'}" 
                                         alt="${item.title || item.name}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;


    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        backdrop.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            backdrop.remove();
        }, 300);
    });

    const trailerBtn = modal.querySelector('.trailer-btn');
    if (trailerBtn) {
        trailerBtn.addEventListener('click', (e) => {
            const youtubeId = e.currentTarget.getAttribute('data-youtube-id');
            watchTrailer(youtubeId);
        });
    }
    

    backdrop.addEventListener('click', () => {
        modal.classList.remove('active');
        backdrop.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            backdrop.remove();
        }, 300);
    });
}

function watchTrailer(youtubeKey) {
    let trailerModal = document.querySelector('.trailer-modal');
    if (!trailerModal) {
        trailerModal = document.createElement('div');
        trailerModal.classList.add('trailer-modal');
        trailerModal.innerHTML = `
            <div class="trailer-content">
                <span class="close-trailer">&times;</span>
                <div class="video-container">
                    <iframe class="trailer-video" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(trailerModal);
        

        const closeBtn = trailerModal.querySelector('.close-trailer');
        closeBtn.addEventListener('click', () => {
            trailerModal.classList.remove('active');
            const iframe = trailerModal.querySelector('iframe');
            iframe.src = '';
        });
    }
    
    const iframe = trailerModal.querySelector('iframe');
    iframe.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1`;
    trailerModal.classList.add('active');
}

function convertToStars(rating) {
    const stars = Math.round(rating / 2);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading');
    loadingDiv.innerHTML = `
        <div class="spinner"></div>
        <p>Loading...</p>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.querySelector('.loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error');
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function displayNoResults() {
    moviesList.innerHTML = `
        <div class="no-results">
            <i class="fas fa-film"></i>
            <p>No movies found. Try a different search.</p>
        </div>
    `;


    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    pageInfo.textContent = 'Page 1 of 1';
}


function updatePagination() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.movie-modal.active');
        const backdrop = document.querySelector('.modal-backdrop.active');
        const trailerModal = document.querySelector('.trailer-modal.active');
        
        if (modal && backdrop) {
            modal.classList.remove('active');
            backdrop.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                backdrop.remove();
            }, 300);
        }
        
        if (trailerModal) {
            trailerModal.classList.remove('active');
            const iframe = trailerModal.querySelector('iframe');
            iframe.src = '';
        }
    }
});