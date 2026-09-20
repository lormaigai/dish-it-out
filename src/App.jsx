import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { INGREDIENT_GROUPS, ALL_ITEMS, findItem } from './ingredients.js'
import { MEALS, MENU, scoreDish } from './menu.js'
import { getRecipeSource } from './recipeSources.js'

const LS_SELECTED = 'wic_selected'

function loadSelected() {
  try {
    const raw = localStorage.getItem(LS_SELECTED)
    if (!raw) return new Set()
    const ids = JSON.parse(raw).filter(id => findItem(id))
    return new Set(ids)
  } catch { return new Set() }
}

function Squiggle({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 10" fill="none" aria-hidden="true">
      <path d="M2 7 Q 12 2, 22 6 T 42 6 T 62 6 T 82 6 T 102 6 T 118 5"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// deterministic little tilt so shelf items feel hand-placed
function tilt(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return (h % 11) - 5 // -5..5 deg
}

function ShelfItem({ item, onRemove }) {
  return (
    <button
      className="shelf-item"
      style={{ '--tilt': `${tilt(item.id)}deg` }}
      onClick={event => onRemove(item.id, event.currentTarget)}
      data-shelf-item={item.id}
      aria-label={`Put ${item.name} back`}
      title={`${item.name} - tap to put back`}
    >
      <span className="shelf-item-emoji" aria-hidden="true">{item.emoji}</span>
      <span className="shelf-item-name">{item.name}</span>
    </button>
  )
}

function ZoneShelf({ zoneId, label, selected, onRemove, className = '' }) {
  const items = ALL_ITEMS.filter(i => i.zone === zoneId && selected.has(i.id))
  return (
    <div className={`zone ${className} ${items.length > 8 ? 'crowded' : ''}`} data-zone={zoneId}>
      <div className="zone-items">
        {items.map(item => <ShelfItem key={item.id} item={item} onRemove={onRemove} />)}
      </div>
      <span className="zone-label">{label}</span>
    </div>
  )
}

function ClosedKitchen({ state, onOpen }) {
  return (
    <div className={`closed-kitchen ${state === 'opening' ? 'opening' : ''}`}>
      <button className="closed-fridge" onClick={onOpen} disabled={state === 'opening'} aria-label="Open the fridge">
        <span className="closed-freezer-door"><span className="closed-handle top" /></span>
        <span className="closed-main-door"><span className="closed-handle bottom" /></span>
        <span className="fridge-inside" aria-hidden="true">
          <span className="inside-shelf one" /><span className="inside-shelf two" /><span className="inside-drawer" />
        </span>
      </button>
      <div className="closed-pantry" aria-hidden="true"><span className="pantry-knob" /></div>
      <div className="open-prompt">
        <p>{state === 'opening' ? 'opening the fridge…' : 'start with what you have'}</p>
        {state !== 'opening' && <button className="btn btn-primary open-btn" onClick={onOpen}>open the fridge →</button>}
      </div>
    </div>
  )
}

function Kitchen({ selected, onRemove, closing }) {
  return (
    <div className={`kitchen ${closing ? 'closing' : ''}`}>
      <div className="fridge-door" aria-label="Fridge door rack">
        <div className="door-rack">
          <ZoneShelf zoneId="door" label="door rack" selected={selected} onRemove={onRemove} />
        </div>
        <span className="door-handle" aria-hidden="true" />
      </div>

      <div className="fridge" aria-label="Fridge">
        <div className="freezer">
          <ZoneShelf zoneId="freezer" label="freezer" selected={selected} onRemove={onRemove} />
        </div>
        <div className="fridge-body">
          <ZoneShelf zoneId="shelf-top" label="top shelf" selected={selected} onRemove={onRemove} className="shelf" />
          <ZoneShelf zoneId="shelf-mid" label="middle shelf" selected={selected} onRemove={onRemove} className="shelf" />
          <ZoneShelf zoneId="crisper" label="crisper drawer" selected={selected} onRemove={onRemove} className="crisper" />
        </div>
      </div>

      <div className="pantry" aria-label="Pantry">
        <div className="pantry-shelf">
          <ZoneShelf zoneId="pantry" label="pantry" selected={selected} onRemove={onRemove} />
        </div>
      </div>
    </div>
  )
}

function IngChip({ id, have, missing }) {
  const item = findItem(id)
  if (!item) return null
  const cls = have ? 'ing-chip have' : missing ? 'ing-chip missing' : 'ing-chip'
  return <span className={cls}>{item.emoji} {item.name}</span>
}

function DishCard({ scored, selectedSet, index }) {
  const { dish, isPick, matched, missing, anyMissing } = scored
  const needsAny = dish.needsAny || []
  const gap = missing.length + (anyMissing ? 1 : 0)
  const farOff = !matched && !isPick && gap > 2
  const requiredCount = (dish.needs || []).length + (needsAny.length > 0 ? 1 : 0)
  const matchedCount = Math.max(0, requiredCount - gap)
  const matchPct = requiredCount > 0 ? Math.round((matchedCount / requiredCount) * 100) : 0
  const source = getRecipeSource(dish.id)

  return (
    <article className={`dish-card ${matched ? 'matched' : ''} ${source ? 'has-source' : ''}`}
      style={{ animationDelay: `${Math.min(index || 0, 16) * 30}ms` }}>
      <div className="dish-head">
        <h3 className="dish-name">{dish.name}</h3>
        <span className={`dish-tag ${matched ? 'tag-match' : (isPick || farOff) ? 'tag-pick' : 'tag-almost'}`}>
          {matched ? 'from your fridge' : (isPick || farOff) ? 'menu pick' : 'almost'}
        </span>
      </div>
      {dish.desc && <p className="dish-desc">{dish.desc}</p>}

      {!isPick && selectedSet.size > 0 && (
        <>
          <div className="dish-match-row" aria-label={`${matchPct}% ingredient match`}>
            <span>{matchedCount}/{requiredCount} matched</span>
            <strong>{matchPct}%</strong>
          </div>
          <div className="dish-match-track" aria-hidden="true">
            <span style={{ '--match': `${matchPct}%` }} />
          </div>
          <div className="dish-ings">
            {(dish.needs || []).map(id => (
              <IngChip key={id} id={id} have={selectedSet.has(id)} missing={!selectedSet.has(id)} />
            ))}
            {needsAny.length > 0 && (
              anyMissing
                ? <span className="ing-chip missing">🍗 chicken or fish</span>
                : <span className="ing-chip have">🍗 chicken or fish</span>
            )}
          </div>
        </>
      )}

      {source && (
        <a className="recipe-link" href={source.url} target="_blank" rel="noreferrer">
          <span>recipe reference</span>
          <strong>{source.label} ↗</strong>
        </a>
      )}
    </article>
  )
}

function BestMatch({ scored, selectedSet }) {
  if (!scored) return null

  const { dish, matched, missing, anyMissing } = scored
  const source = getRecipeSource(dish.id)
  const used = [...(dish.needs || []), ...(dish.needsAny || [])]
    .filter((id, index, ids) => selectedSet.has(id) && ids.indexOf(id) === index)
  const gap = missing.length + (anyMissing ? 1 : 0)

  return (
    <section className="best-match" aria-label="Best fridge match">
      <div className="best-match-copy">
        <p className="best-match-kicker">best fridge match</p>
        <h2>{dish.name}</h2>
        <p>{dish.desc || 'A strong match for what is already in your kitchen.'}</p>
        <div className="best-match-meta">
          <span>{used.length} stocked ingredient{used.length === 1 ? '' : 's'} used</span>
          <span>{matched ? 'ready from your fridge' : `${gap} item${gap === 1 ? '' : 's'} away`}</span>
        </div>
        {source && (
          <a className="best-match-link" href={source.url} target="_blank" rel="noreferrer">
            open recipe reference <span>{source.label} ↗</span>
          </a>
        )}
      </div>
      <div className="best-match-ingredients" aria-label="Ingredients this dish uses">
        {used.length > 0
          ? used.slice(0, 7).map((id, index) => {
              const item = findItem(id)
              return item ? (
                <span key={id} style={{ '--chip-delay': `${index * 70}ms` }}>
                  <b aria-hidden="true">{item.emoji}</b>
                  {item.name}
                </span>
              ) : null
            })
          : <span className="best-match-empty">menu pick</span>}
      </div>
    </section>
  )
}

function MealSection({ meal, dishes, selectedSet }) {
  const matched = []
  const almost = []
  const picks = []
  dishes.forEach(s => {
    if (s.matched) { matched.push(s); return }
    const gap = s.missing.length + (s.anyMissing ? 1 : 0)
    if (!s.isPick && gap <= 2) { almost.push(s); return }
    picks.push(s)
  })

  let idx = 0
  return (
    <section className="meal-section">
      <div className="meal-header">
        <h2 className="meal-title">{meal.label}</h2>
        {matched.length > 0 && <span className="meal-count">{matched.length} from your fridge</span>}
      </div>

      {matched.length > 0 && (
        <div className="dish-grid">
          {matched.map(s => <DishCard key={s.dish.id} scored={s} selectedSet={selectedSet} index={idx++} />)}
        </div>
      )}

      {almost.length > 0 && (
        <>
          <p className="sub-label">a thing or two away</p>
          <div className="dish-grid">
            {almost.map(s => <DishCard key={s.dish.id} scored={s} selectedSet={selectedSet} index={idx++} />)}
          </div>
        </>
      )}

      {picks.length > 0 && (
        <>
          <p className="sub-label">{matched.length > 0 || almost.length > 0 ? 'also on the menu' : 'on the menu'}</p>
          <div className="dish-grid">
            {picks.map(s => <DishCard key={s.dish.id} scored={s} selectedSet={selectedSet} index={idx++} />)}
          </div>
        </>
      )}
    </section>
  )
}

const TRANSITION_BEATS = ['closing the fridge…', 'peeking at the menu…', 'plating up…']

export default function App() {
  const [selected, setSelected] = useState(loadSelected)
  const [view, setView] = useState('fridge') // fridge | transition | results
  const [entrance, setEntrance] = useState('closed') // closed | opening | open
  const [closing, setClosing] = useState(false)
  const [beat, setBeat] = useState(0)
  const [pickerSearch, setPickerSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const timers = useRef([])
  const moving = useRef(new Set())

  useEffect(() => {
    try { localStorage.setItem(LS_SELECTED, JSON.stringify([...selected])) } catch {}
  }, [selected])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const openFridge = useCallback(() => {
    if (entrance !== 'closed') return
    setEntrance('opening')
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    timers.current.push(setTimeout(() => setEntrance('open'), reduceMotion ? 80 : 1050))
  }, [entrance])

  const moveIngredient = useCallback((id, sourceEl) => {
    if (moving.current.has(id)) return
    const item = findItem(id)
    if (!item) return
    const adding = !selected.has(id)
    const destination = adding
      ? document.querySelector(`[data-zone="${item.zone}"] .zone-items`)
      : document.querySelector(`[data-picker-item="${id}"]`)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const commit = () => setSelected(prev => {
      const next = new Set(prev)
      if (adding) next.add(id)
      else next.delete(id)
      return next
    })

    if (reduceMotion || !sourceEl || !destination) { commit(); return }

    moving.current.add(id)
    const from = sourceEl.getBoundingClientRect()
    const to = destination.getBoundingClientRect()
    const flyer = document.createElement('div')
    flyer.className = 'ingredient-flyer'
    flyer.setAttribute('aria-hidden', 'true')
    flyer.innerHTML = `<span>${item.emoji}</span><small>${item.name}</small>`
    document.body.appendChild(flyer)
    Object.assign(flyer.style, {
      left: `${from.left + from.width / 2}px`,
      top: `${from.top + from.height / 2}px`,
    })
    sourceEl.classList.add('moving-ingredient')
    const dx = to.left + Math.min(to.width / 2, 54) - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    const motion = flyer.animate([
      { transform: 'translate(-50%, -50%) scale(.9) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * .55}px), calc(-50% + ${dy * .25 - 22}px)) scale(1.18) rotate(-7deg)`, opacity: 1, offset: .52 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.72) rotate(4deg)`, opacity: .15 },
    ], { duration: 620, easing: 'cubic-bezier(.25,.75,.25,1)', fill: 'forwards' })
    motion.finished.catch(() => {}).finally(() => {
      commit()
      flyer.remove()
      sourceEl.classList.remove('moving-ingredient')
      moving.current.delete(id)
    })
  }, [selected])

  const generate = useCallback(() => {
    if (view !== 'fridge') return
    setClosing(true)
    timers.current.push(setTimeout(() => { setView('transition'); setBeat(0) }, 750))
    TRANSITION_BEATS.forEach((_, i) => {
      if (i > 0) timers.current.push(setTimeout(() => setBeat(i), 750 + i * 550))
    })
    timers.current.push(setTimeout(() => {
      setView('results')
      setClosing(false)
      window.scrollTo({ top: 0 })
    }, 750 + TRANSITION_BEATS.length * 550 + 250))
  }, [view])

  const backToFridge = () => {
    setView('fridge')
    window.scrollTo({ top: 0 })
  }

  const visibleGroups = useMemo(() => {
    if (!pickerSearch.trim()) return INGREDIENT_GROUPS
    const q = pickerSearch.toLowerCase()
    return INGREDIENT_GROUPS.map(g => ({
      ...g,
      items: g.items.filter(i => i.name.toLowerCase().includes(q)),
    })).filter(g => g.items.length > 0)
  }, [pickerSearch])

  const scoredMenu = useMemo(() => MENU.map(d => scoreDish(d, selected)), [selected])
  const selectedItems = useMemo(() => ALL_ITEMS.filter(item => selected.has(item.id)), [selected])

  const matchCount = useMemo(() => scoredMenu.filter(s => s.matched).length, [scoredMenu])

  const bestMatch = useMemo(() => {
    if (selected.size === 0) return null

    const usageCount = scored => {
      const direct = (scored.dish.needs || []).filter(id => selected.has(id)).length
      const any = (scored.dish.needsAny || []).some(id => selected.has(id)) ? 1 : 0
      return direct + any
    }

    return [...scoredMenu]
      .filter(scored => !scored.isPick)
      .sort((a, b) => {
        if (a.matched !== b.matched) return a.matched ? -1 : 1
        const gapA = a.missing.length + (a.anyMissing ? 1 : 0)
        const gapB = b.missing.length + (b.anyMissing ? 1 : 0)
        if (gapA !== gapB) return gapA - gapB
        return usageCount(b) - usageCount(a)
      })[0] || null
  }, [scoredMenu, selected])

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <h1 className="wordmark">
              what can i cook?
              <Squiggle className="wordmark-squiggle" />
            </h1>
            <p className="brand-sub">open · stock · choose</p>
          </div>
          {view === 'results' ? (
            <button className="btn btn-ghost" onClick={backToFridge}>← restock the fridge</button>
          ) : entrance === 'open' ? (
            <span className="stock-count">{selected.size} stocked</span>
          ) : (
            <span className="stock-count">fridge closed</span>
          )}
        </div>
      </header>

      {view !== 'results' && (
        <main className={`fridge-view ${view === 'transition' ? 'transitioning' : ''}`}>
          {entrance !== 'open' ? (
            <div className="entrance-wrap">
              <ClosedKitchen state={entrance} onOpen={openFridge} />
            </div>
          ) : (
            <>
          <div className="kitchen-wrap kitchen-reveal">
            <Kitchen selected={selected} onRemove={moveIngredient} closing={closing} />
          </div>

          <aside className="picker picker-reveal">
            <div className="picker-head">
              <h2 className="picker-title">stock your kitchen</h2>
              {selected.size > 0 && (
                <button className="clear-btn" onClick={() => setSelected(new Set())}>empty it all</button>
              )}
            </div>
            <p className="picker-hint">tap what you have - it lands right on the shelf</p>

            <input
              className="picker-search"
              placeholder="filter ingredients…"
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              aria-label="Filter ingredients"
            />

            {visibleGroups.length === 0 && (
              <p className="picker-empty">nothing matches “{pickerSearch}”</p>
            )}

            {visibleGroups.map(group => {
              const picked = group.items.filter(i => selected.has(i.id)).length
              return (
                <section key={group.label} className="group">
                  <h3 className="group-label">
                    {group.label}
                    {picked > 0 && <span className="group-picked">{picked}</span>}
                  </h3>
                  <div className="group-items">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        className={`ing-btn ${selected.has(item.id) ? 'selected' : ''}`}
                        onClick={event => moveIngredient(item.id, event.currentTarget)}
                        data-picker-item={item.id}
                        aria-pressed={selected.has(item.id)}
                      >
                        <span className="ing-emoji" aria-hidden="true">{item.emoji}</span>
                        <span className="ing-name">{item.name}</span>
                        {selected.has(item.id) && <span className="ing-check" aria-hidden="true">✓</span>}
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </aside>
            </>
          )}

          {entrance === 'open' && <div className="generate-bar">
            <div className="generate-inner">
              <span className="generate-note">
                {selected.size === 0
                  ? 'nothing stocked yet - browse the full menu'
                  : `${selected.size} ingredient${selected.size === 1 ? '' : 's'} stocked`}
              </span>
              <button className="btn btn-primary btn-generate" onClick={generate}>
                what can i cook? →
              </button>
            </div>
          </div>}

          {view === 'transition' && (
            <div className="transition-overlay" role="status" aria-live="polite">
              <div className="transition-card">
                {selectedItems.length > 0 ? (
                  <div className="transition-orbit" aria-hidden="true">
                    <span className="transition-plate" />
                    {selectedItems.slice(0, 8).map((item, index, items) => (
                      <span
                        className="transition-orbit-item"
                        key={item.id}
                        style={{
                          '--angle': `${index * (360 / items.length)}deg`,
                          '--orbit-delay': `${index * 70}ms`,
                        }}
                      >
                        {item.emoji}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="transition-mark" aria-hidden="true"><span /><span /><span /></span>
                )}
                <p className="transition-text" key={beat}>{TRANSITION_BEATS[beat]}</p>
                <p className="transition-sub">matching your shelf against the menu</p>
              </div>
            </div>
          )}
        </main>
      )}

      {view === 'results' && (
        <main className="results-view">
          <div className="menu-frame">
            <p className="menu-kicker">tonight's menu, from your fridge</p>
            <h2 className="menu-wordmark">today's menu</h2>
            <p className="menu-sub">
              {matchCount > 0
                ? `${matchCount} dish${matchCount === 1 ? '' : 'es'} ready with what you stocked`
                : 'nothing fully stocked - here is the whole menu anyway'}
            </p>
            {selectedItems.length > 0 && (
              <div className="stock-trail" aria-label="Your stocked ingredients">
                {selectedItems.slice(0, 10).map((item, index) => (
                  <span key={item.id} style={{ '--trail-delay': `${index * 55}ms` }} title={item.name}>
                    {item.emoji}
                  </span>
                ))}
                {selectedItems.length > 10 && <small>+{selectedItems.length - 10}</small>}
              </div>
            )}
          </div>

          <BestMatch scored={bestMatch} selectedSet={selected} />

          <nav className="meal-filters" aria-label="Filter dishes by meal type">
            <button className={`meal-filter ${resultFilter === 'all' ? 'active' : ''}`} onClick={() => setResultFilter('all')} aria-pressed={resultFilter === 'all'}>All dishes</button>
            {MEALS.map(meal => (
              <button key={meal.id} className={`meal-filter ${resultFilter === meal.id ? 'active' : ''}`} onClick={() => setResultFilter(meal.id)} aria-pressed={resultFilter === meal.id}>
                {meal.label}
              </button>
            ))}
          </nav>

          {MEALS.filter(meal => resultFilter === 'all' || resultFilter === meal.id).map(meal => (
            <MealSection
              key={meal.id}
              meal={meal}
              dishes={scoredMenu.filter(s => s.dish.meal === meal.id)}
              selectedSet={selected}
            />
          ))}

          <div className="results-foot-row">
            <button className="btn btn-primary" onClick={backToFridge}>← restock the fridge</button>
          </div>

          <footer className="foot">your picks stay in your browser</footer>
        </main>
      )}
    </div>
  )
}
