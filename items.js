/* FitPro Elite — Styles */


        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
            padding: 12px;
            color: #0f172a;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0 4px;
        }

        .header {
            margin-bottom: 18px;
        }

        .header h1 {
            /* Overridden by inline styles */
        }

        .card {
            background: #ffffff;
            border-radius: 18px;
            padding: 20px;
            margin-bottom: 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
            border: none;
        }

        .nav-tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 16px;
            background: #ffffff;
            border-radius: 18px;
            padding: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
        }

        .nav-tab {
            flex: 1;
            padding: 8px 4px 7px;
            border: none;
            border-radius: 13px;
            background: transparent;
            cursor: pointer;
            font-size: 0.58em;
            font-weight: 700;
            transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
            color: #94a3b8;
            min-height: 52px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            text-align: center;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            overflow: hidden;
        }
        .nav-tab svg { width: 20px; height: 20px; flex-shrink: 0; transition: all 0.2s; }
        .nav-tab.active {
            color: #16a34a;
            background: rgba(22,163,74,0.08);
        }
        .nav-tab.active svg { filter: drop-shadow(0 0 4px rgba(22,163,74,0.5)); }
        .nav-tab:active { transform: scale(0.93); }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .workout-card {
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            border: 2px solid transparent;
            padding: 25px;
        }

        .workout-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
            border-color: #16a34a;
        }

        .workout-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }

        .workout-icon {
            font-size: 2.5em;
            margin-right: 15px;
        }

        .workout-info h3 {
            color: #16a34a;
            margin-bottom: 8px;
            font-size: 1.3em;
        }

        .workout-meta {
            display: flex;
            gap: 20px;
            color: #666;
            font-size: 1em;
        }

        .btn {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            border: none;
            padding: 20px 35px;
            border-radius: 50px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
            transition: transform 0.2s, box-shadow 0.2s;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(22, 163, 74, 0.4);
        }

        .btn-secondary {
            background: #e0e0e0;
            color: #333;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 25px;
        }

        .stat-box {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 25px 20px;
            border-radius: 15px;
            text-align: center;
        }

        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .stat-label {
            font-size: 1em;
            opacity: 0.9;
        }

        /* Exercise Database Styles */
        .filters {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .filter-group label {
            font-weight: bold;
            color: #16a34a;
            font-size: 0.9em;
        }

        select, input {
            padding: 16px;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            font-size: 1.1em;
            transition: border-color 0.3s;
            min-height: 55px;
        }

        select:focus, input:focus {
            outline: none;
            border-color: #16a34a;
        }

        .exercises-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .exercise-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            padding: 0;
            transition: all 0.3s;
            cursor: pointer;
            overflow: hidden;
        }

        .exercise-card:hover {
            border-color: #16a34a;
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(22, 163, 74, 0.2);
        }

        .exercise-image {
            width: 100%;
            height: 320px;
            background: linear-gradient(160deg, #1A1B20 0%, #111318 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            gap: 20px;
            padding: 20px;
        }

        .exercise-image svg {
            width: 220px;
            height: 220px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }

        .position-label {
            position: absolute;
            bottom: 10px;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            padding: 5px 15px;
            border-radius: 20px;
            color: white;
            font-size: 0.85em;
            font-weight: bold;
        }

        .position-start {
            left: 50px;
        }

        .position-end {
            right: 50px;
        }

        .exercise-animation {
            display: flex;
            gap: 30px;
            align-items: center;
            justify-content: center;
            width: 100%;
        }

        .arrow-indicator {
            color: white;
            font-size: 2em;
            opacity: 0.7;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
        }

        @keyframes buttonAnalyzing {
            0% { 
                transform: scale(1);
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
            }
            50% { 
                transform: scale(1.05);
                box-shadow: 0 8px 24px rgba(34, 197, 94, 0.5);
            }
            100% { 
                transform: scale(1);
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
            }
        }

        @keyframes spinBrain {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .btn-analyzing {
            animation: buttonAnalyzing 1.5s infinite;
            position: relative;
            overflow: hidden;
            pointer-events: none;
        }

        .btn-analyzing::after {
            content: '';
            position: absolute;
            top: 50%;
            left: -100%;
            width: 200%;
            height: 200%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transform: translateY(-50%);
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .brain-spin {
            display: inline-block;
            animation: spinBrain 2s linear infinite;
        }

        .exercise-svg-container {
            position: relative;
        }

        .exercise-card-content {
            padding: 20px;
        }

        .exercise-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }

        .difficulty-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            white-space: nowrap;
            display: inline-block;
        }

        .difficulty-debutant {
            background: #4ade80;
            color: white;
        }

        .difficulty-intermediaire {
            background: #fbbf24;
            color: white;
        }

        .difficulty-avance {
            background: #f87171;
            color: white;
        }

        .muscle-group {
            display: inline-block;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.85em;
            margin-bottom: 10px;
        }

        .exercise-description {
            color: #666;
            font-size: 0.95em;
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .exercise-meta {
            display: flex;
            gap: 15px;
            font-size: 0.85em;
            color: #888;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e0e0e0;
        }

        /* Workout Session Styles */
        .timer {
            text-align: center;
            padding: 25px 20px;
            background: transparent;
            border-radius: 12px;
            color: #1e293b;
            margin-bottom: 20px;
            position: relative;
            border: none;
        }

        .next-exercise-preview {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(22, 163, 74, 0.08);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 12px 16px;
            max-width: 200px;
            text-align: left;
            border: 1px solid rgba(22, 163, 74, 0.2);
        }

        .next-exercise-label {
            font-size: 0.7em;
            opacity: 0.7;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            color: #16a34a;
        }

        .next-exercise-name {
            font-size: 0.9em;
            font-weight: 600;
            line-height: 1.3;
            color: #1e293b;
        }

        .timer-countdown-warning {
            color: #ffffff !important;
            text-shadow: 0 0 20px rgba(239,68,68,0.9) !important;
            animation: pulse-warning 0.5s infinite !important;
        }

        @keyframes pulse-warning {
            0%, 100% { 
                transform: scale(1);
            }
            50% { 
                transform: scale(1.05);
            }
        }

        .timer-display {
            font-size: 4em;
            font-weight: 900;
            margin: 20px 0;
            color: white;
            text-shadow: 0 2px 12px rgba(0,0,0,0.3);
            background: none;
            padding: 0;
            border-radius: 0;
            line-height: 1;
            letter-spacing: -2px;
        }

        .exercise-name {
            font-size: 1.3em;
            margin-bottom: 10px;
            font-weight: 600;
            color: #1e293b;
        }

        .exercise-number {
            opacity: 0.6;
            margin-bottom: 12px;
            font-size: 0.8em;
            color: #64748b;
        }

        .timer-controls {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .timer-controls button {
            flex: 1;
            min-width: 120px;
            padding: 12px 20px;
            font-size: 1em;
            min-height: 48px;
            border-radius: 10px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .timer-controls button:hover {
            transform: translateY(-1px);
        }
        
        .timer-controls button:active {
            transform: translateY(0);
        }

        .exercise-description-box {
            background: #f5f5f5;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 25px;
        }

        .exercise-description-box h4 {
            color: #16a34a;
            margin-bottom: 15px;
            font-size: 1.2em;
        }

        .exercise-description-box ul {
            margin-left: 25px;
            line-height: 1.8;
            font-size: 1.05em;
        }

        .exercise-description-box li {
            margin-bottom: 8px;
        }

        .progress-bar {
            height: 12px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 25px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #16a34a 0%, #15803d 100%);
            transition: width 0.3s;
        }

        .completion-screen {
            text-align: center;
            padding: 40px 20px;
        }

        .completion-screen h2 {
            color: #16a34a;
            font-size: 2.5em;
            margin-bottom: 20px;
        }

        .completion-icon {
            font-size: 5em;
            margin-bottom: 20px;
        }

        .hidden {
            display: none;
        }

        /* Exercise Search Results */
        .exercise-result-item {
            transition: all 0.3s ease;
        }

        .exercise-result-item:hover {
            background: linear-gradient(135deg, #FFF3E0 0%, #bbf7d0 100%) !important;
            transform: translateX(8px);
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
        }

        .exercise-result-item:active {
            transform: translateX(8px) scale(0.98);
        }

        #exerciseSearch:focus {
            outline: none;
            border-color: #16a34a !important;
            box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        /* Dark Mode Styles */
        body.dark-mode {
            background: #0a0a0a;
            color: #f1f5f9;
        }

        body.dark-mode .header h1 {
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        body.dark-mode .header p {
            color: #64748b;
        }

        body.dark-mode .card {
            background: #141414;
            color: #f1f5f9;
            box-shadow: 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4);
        }

        body.dark-mode [data-location-id]:not(.loc-active) {
            background: #1c1c1c !important;
            border-color: #2a2a2a !important;
        }
        body.dark-mode [data-location-id]:not(.loc-active) [data-loc-text] {
            color: #e2e8f0 !important;
        }

        body.dark-mode .nav-tabs {
            background: #141414;
            box-shadow: 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4);
        }

        body.dark-mode .nav-tab {
            color: #475569;
        }

        body.dark-mode .nav-tab.active {
            color: #22c55e;
            background: rgba(34,197,94,0.1);
        }

        body.dark-mode .equipment-item,
        body.dark-mode .exercise-card,
        body.dark-mode .workout-card {
            background: #1c1c1c;
            color: #f1f5f9;
            border-color: #2a2a2a;
        }

        body.dark-mode .modal-content {
            background: #141414;
            color: #e2e8f0;
        }
        body.dark-mode .modal-content h2,
        body.dark-mode .modal-content h3 { color: #ffffff; }
        body.dark-mode .modal-content p,
        body.dark-mode .modal-content li { color: #64748b; }
        body.dark-mode .modal-content strong { color: #e2e8f0; }

        body.dark-mode input,
        body.dark-mode select {
            background: #1c1c1c;
            color: #f1f5f9;
            border-color: #2a2a2a;
        }

        body.dark-mode .exercise-description-box,
        body.dark-mode .instructions-list,
        body.dark-mode .tips-box {
            background: #1c1c1c;
        }

        /* ── MICRO-ANIMATIONS & INTERACTIONS ──────────────────────── */
        .btn, button:not([style*="background:none"]) {
            transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1),
                        box-shadow 0.12s ease,
                        opacity 0.12s ease;
        }
        .btn:active, button:not([style*="background:none"]):active {
            transform: scale(0.95) !important;
        }

        /* Cards — subtle lift on tap */
        .card.workout-card, .card.exercise-card {
            transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .card.workout-card:active, .card.exercise-card:active {
            transform: scale(0.985);
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        /* Typography hierarchy */
        h1, h2, h3 {
            letter-spacing: -0.3px;
        }
        h1 { font-size: 1.6em; font-weight: 900; }
        h2 { font-size: 1.2em; font-weight: 800; }
        h3 { font-size: 1em; font-weight: 700; }

        /* Large stat numbers */
        .stat-value, .timer-display, #restCountDisplay {
            font-variant-numeric: tabular-nums;
            letter-spacing: -2px;
        }

        /* Inputs — cleaner */
        input, select, textarea {
            border-radius: 10px;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #16a34a !important;
            box-shadow: 0 0 0 3px rgba(22,163,74,0.12) !important;
        }

        /* Separator between sections */
        .section-gap { height: 8px; }

        /* Page transitions */
        .tab-content.active {
            animation: tabFadeIn 0.2s ease;
        }
        @keyframes tabFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* Badges Styles */
        .badge-item {
            background: white;
            border: 3px solid #e0e0e0;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            transition: all 0.3s;
            position: relative;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .badge-item.locked {
            opacity: 0.4;
            filter: grayscale(100%);
        }

        .badge-item.unlocked {
            border-color: #fbbf24;
            box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
            animation: badgeUnlock 0.5s ease;
        }

        @keyframes badgeUnlock {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }

        .badge-icon {
            font-size: 3.5em;
            margin-bottom: 10px;
        }

        .badge-name {
            font-size: 1.1em;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        body.dark-mode .badge-name {
            color: #e0e0e0;
        }

        .badge-description {
            font-size: 0.85em;
            color: #666;
        }

        body.dark-mode .badge-description {
            color: #b0b0b0;
        }

        .badge-progress {
            font-size: 0.9em;
            color: #16a34a;
            margin-top: 8px;
            font-weight: 600;
        }

        /* Calendar Styles */
        .calendar-day {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            padding: 15px 10px;
            text-align: center;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.3s;
            cursor: pointer;
        }

        body.dark-mode .calendar-day {
            background: #222328;
            border-color: #2E2F35;
        }

        .calendar-day.has-workout {
            background: linear-gradient(135deg, #16a34a15 0%, #15803d15 100%);
            border-color: #16a34a;
        }

        .calendar-day.has-workout .calendar-day-number {
            color: #16a34a;
            font-weight: bold;
        }

        .calendar-day.other-month {
            opacity: 0.3;
        }

        .calendar-day.today {
            border-color: #4ade80;
            border-width: 3px;
        }

        .calendar-day-number {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .calendar-day-dot {
            width: 8px;
            height: 8px;
            background: #16a34a;
            border-radius: 50%;
            margin-top: 5px;
        }

        .calendar-header {
            font-weight: bold;
            padding: 10px;
            text-align: center;
            color: #16a34a;
        }

        /* History List Styles */
        .history-item {
            background: #f5f5f5;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 5px solid #16a34a;
            transition: all 0.3s;
        }

        body.dark-mode .history-item {
            background: #222328;
        }

        .history-item:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .history-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .history-item-date {
            font-weight: bold;
            color: #16a34a;
            font-size: 1.1em;
        }

        .history-item-duration {
            background: #16a34a;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
        }

        .history-item-name {
            font-size: 1.1em;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .history-item-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            color: #666;
        }

        body.dark-mode .history-item-stats {
            color: #b0b0b0;
        }

        .history-item-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .history-item-actions button {
            flex: 1;
            padding: 10px;
            font-size: 0.9em;
        }

        /* Favorite Workout Styles */
        .favorite-workout-card {
            background: white;
            border: 3px solid #e0e0e0;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }

        body.dark-mode .favorite-workout-card {
            background: #222328;
            border-color: #2E2F35;
        }

        .favorite-workout-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(22, 163, 74, 0.3);
            border-color: #16a34a;
        }

        .favorite-workout-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }

        .favorite-workout-name {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .favorite-workout-meta {
            font-size: 0.9em;
            color: #666;
        }

        body.dark-mode .favorite-workout-meta {
            color: #b0b0b0;
        }

        .delete-favorite-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #f87171;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Graph Styles */
        .graph-tab-btn {
            background: white !important;
            color: #16a34a !important;
            border: 2px solid #e0e0e0 !important;
        }

        body.dark-mode .graph-tab-btn {
            background: #222328 !important;
            color: #b0b0b0 !important;
            border-color: #2E2F35 !important;
        }

        .graph-tab-btn.active {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
            color: white !important;
            border-color: #16a34a !important;
        }

        body.dark-mode #graphContainer {
            background: #222328;
        }

        .bar-chart-container {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            height: 250px;
            gap: 10px;
            padding: 20px;
        }

        .bar-chart-bar {
            flex: 1;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            border-radius: 8px 8px 0 0;
            transition: all 0.3s;
            cursor: pointer;
            position: relative;
            min-height: 10px;
        }

        .bar-chart-bar:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(22, 163, 74, 0.4);
        }

        .bar-chart-label {
            text-align: center;
            margin-top: 10px;
            font-size: 0.9em;
            color: #666;
        }

        body.dark-mode .bar-chart-label {
            color: #b0b0b0;
        }

        .bar-chart-value {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            color: #16a34a;
            font-size: 0.9em;
        }

        /* Exercise Demo Modal Styles */
        .demo-animation {
            width: 100%;
            max-width: 400px;
            height: 300px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border-radius: 12px;
        }

        body.dark-mode .demo-animation {
            background: #1A1B20;
        }

        .demo-figure {
            width: 200px;
            height: 320px;
        }

        @keyframes exerciseDemo {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
        }

        .demo-figure.animated {
            animation: exerciseDemo 2s ease-in-out infinite;
        }

        /* INTELLIGENT SYSTEM CSS */
        
        /* Feedback Buttons */
        .feedback-btn {
            padding: 15px 10px;
            border: 2px solid #e0e0e0;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1.1em;
            text-align: center;
        }

        body.dark-mode .feedback-btn {
            background: #222328;
            border-color: #2E2F35;
            color: #e0e0e0;
        }

        .feedback-btn:hover {
            border-color: #16a34a;
            background: #FFF3E0;
            transform: translateY(-2px);
        }

        body.dark-mode .feedback-btn:hover {
            background: #332015;
        }

        .feedback-btn.selected {
            border-color: #16a34a;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        /* Advanced Mode Styles */
        .advanced-mode-only {
            display: none;
        }

        body.advanced-mode .advanced-mode-only {
            display: block;
        }

        body.advanced-mode .simple-mode-only {
            display: none;
        }

        .exercise-detail-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
            border-left: 4px solid #16a34a;
        }

        body.dark-mode .exercise-detail-card {
            background: #222328;
        }

        .exercise-detail-card h4 {
            margin: 0 0 10px 0;
            color: #16a34a;
            font-size: 1em;
        }

        body.dark-mode .exercise-detail-card h4 {
            color: #4ade80;
        }

        .exercise-detail-card ul {
            margin: 8px 0 0 0;
            padding-left: 20px;
        }

        .exercise-detail-card li {
            margin: 5px 0;
            color: #666;
        }

        body.dark-mode .exercise-detail-card li {
            color: #b0b0b0;
        }

        /* Fitness Index Slider */
        #fitnessIndexSlider {
            -webkit-appearance: none;
            width: 100%;
            height: 10px;
            border-radius: 6px;
            background: rgba(255,255,255,0.12);
            outline: none;
            transition: background 0.3s;
        }

        #fitnessIndexSlider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            border: 3px solid #16a34a;
            transition: transform 0.15s, border-color 0.3s;
        }
        #fitnessIndexSlider::-webkit-slider-thumb:active {
            transform: scale(1.2);
        }

        #fitnessIndexSlider::-moz-range-thumb {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            border: 3px solid #16a34a;
        }

        /* Recovery Warning Styles */
        .recovery-warning {
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .recovery-warning.high {
            background: rgba(248,113,113,0.12);
            border-left: 4px solid #f87171;
            color: #e2e8f0;
        }

        .recovery-warning.medium {
            background: rgba(251,191,36,0.12);
            border-left: 4px solid #fbbf24;
            color: #e2e8f0;
        }

        .recovery-warning.low {
            background: rgba(96,165,250,0.1);
            border-left: 4px solid #60a5fa;
            color: #e2e8f0;
        }

        body.dark-mode .recovery-warning.high {
            background: rgba(248,113,113,0.15);
        }

        body.dark-mode .recovery-warning.medium {
            background: rgba(251,191,36,0.15);
        }

        body.dark-mode .recovery-warning.low {
            background: rgba(96,165,250,0.12);
        }

        /* Progression Badge */
        .progression-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin-left: 8px;
        }

        .progression-badge.easy {
            background: #4ade80;
            color: white;
        }

        .progression-badge.normal {
            background: #60a5fa;
            color: white;
        }

        .progression-badge.hard {
            background: #f87171;
            color: white;
        }

        /* Weekly Plan Day Styles */
        .weekly-plan-day {
            padding: 12px 15px;
            border-radius: 8px;
            margin: 8px 0;
            border-left: 4px solid #e0e0e0;
            transition: all 0.3s;
        }

        .weekly-plan-day:hover {
            transform: translateX(3px);
        }

        .weekly-plan-day.today {
            border-left-color: #16a34a;
            background: #FFF3E0;
            box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
        }

        body.dark-mode .weekly-plan-day.today {
            background: #1A1B20;
        }

        .weekly-plan-day.high {
            background: #fff4f4;
        }

        .weekly-plan-day.moderate {
            background: #fff8f5;
        }

        .weekly-plan-day.low {
            background: #f4fff4;
        }

        .weekly-plan-day.rest {
            background: #f9f9f9;
            opacity: 0.8;
        }

        body.dark-mode .weekly-plan-day.high {
            background: #3a2020;
        }

        body.dark-mode .weekly-plan-day.moderate {
            background: #181A1F;
        }

        body.dark-mode .weekly-plan-day.low {
            background: #203a20;
        }

        body.dark-mode .weekly-plan-day.rest {
            background: #2a2a2a;
        }

        body.dark-mode .exercise-result-item {
            background: linear-gradient(135deg, #222328 0%, #2E2F35 100%) !important;
            color: #e0e0e0;
            border-left-color: #4ade80 !important;
        }

        body.dark-mode .exercise-result-item:hover {
            background: linear-gradient(135deg, #332015 0%, #554030 100%) !important;
        }

        body.dark-mode .exercise-result-item strong {
            color: #e0e0e0;
        }

        body.dark-mode .exercise-result-item div {
            color: #b0b0b0;
        }

        body.dark-mode #exerciseSearch {
            background: #222328;
            color: #e0e0e0;
            border-color: #2E2F35;
        }

        body.dark-mode #exerciseSearch::placeholder {
            color: #888;
        }

        /* Exercise Progress List */
        .exercise-progress-list {
            background: #1A1B20;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
        }

        .exercise-progress-list h4 {
            color: #16a34a;
            margin-bottom: 15px;
            font-size: 1.1em;
        }

        .progress-item {
            display: flex;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 10px;
            background: #222328;
            border: 1px solid #2E2F35;
            transition: all 0.3s;
            position: relative;
        }

        .progress-item.completed {
            background: rgba(74,222,128,0.1);
            border-left: 4px solid #4ade80;
            border-color: rgba(74,222,128,0.3);
        }

        .progress-item.current {
            background: linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(21,128,61,0.1) 100%);
            border-left: 4px solid #16a34a;
            border-color: rgba(22,163,74,0.4);
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
        }

        .progress-item.upcoming {
            opacity: 0.5;
        }

        .progress-checkbox {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid #2E2F35;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.3s;
            font-size: 14px;
            color: white;
            font-weight: bold;
        }

        .progress-item.completed .progress-checkbox {
            background: #4ade80;
            border-color: #4ade80;
        }

        .progress-item.current .progress-checkbox {
            background: #16a34a;
            border-color: #16a34a;
            animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
            0%   { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
            50%  { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
            100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }

        .progress-item-content { flex: 1; }

        .progress-item-name {
            font-weight: 600;
            color: #e2e8f0;
            margin-bottom: 4px;
        }

        .progress-item.completed .progress-item-name {
            color: #4ade80;
        }

        .progress-item.current .progress-item-name {
            color: #4ade80;
            font-weight: 700;
        }

        .progress-item-duration {
            font-size: 0.85em;
            color: #6b7280;
        }

        .progress-item.current .progress-item-duration {
            color: #4ade80;
            font-weight: 600;
        }

        .progress-stats {
            display: flex;
            justify-content: space-between;
            padding: 15px;
            background: rgba(22,163,74,0.08);
            border: 1px solid rgba(22,163,74,0.2);
            border-radius: 10px;
            margin-bottom: 15px;
        }

        .progress-stat { text-align: center; }

        .progress-stat-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #16a34a;
        }

        .progress-stat-label {
            font-size: 0.85em;
            color: #94a3b8;
            margin-top: 4px;
        }

        /* Equipment Selection */
        .equipment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .equipment-item {
            background: white;
            border: 3px solid #e0e0e0;
            border-radius: 15px;
            padding: 30px 25px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            min-height: 160px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .equipment-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .equipment-item.selected {
            background: linear-gradient(135deg, #16a34a15 0%, #15803d15 100%);
            border-color: #16a34a;
            box-shadow: 0 8px 25px rgba(22, 163, 74, 0.3);
        }
        
        .equipment-item.injured-muscle {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-color: #ef4444;
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
            opacity: 0.8;
        }
        
        .equipment-item.injured-muscle .equipment-icon {
            filter: grayscale(50%);
        }

        .equipment-icon {
            font-size: 3.5em;
            margin-bottom: 15px;
            filter: grayscale(100%);
            opacity: 0.5;
            transition: all 0.3s;
        }

        .equipment-item.selected .equipment-icon {
            filter: grayscale(0%);
            opacity: 1;
            transform: scale(1.1);
        }

        .equipment-name {
            font-size: 1.1em;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }

        .equipment-item.selected .equipment-name {
            color: #16a34a;
        }

        .equipment-count {
            font-size: 0.9em;
            color: #666;
        }

        .equipment-item.selected .equipment-count {
            color: #16a34a;
            font-weight: 600;
        }

        .equipment-checkmark {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            background: #4ade80;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2em;
        }

        .equipment-item.selected .equipment-checkmark {
            display: flex;
        }

        .equipment-info {
            background: #FFF3E0;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .equipment-info h3 {
            color: #16a34a;
            margin-bottom: 10px;
        }

        .equipment-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        .random-workout-card {
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            color: white;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            border: none;
        }

        .random-workout-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(74, 222, 128, 0.4);
        }

        .random-workout-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }

        /* Tablet Landscape Optimizations */
        @media (min-width: 768px) and (orientation: landscape) {
            .container {
                padding: 0 30px;
            }
            
            /* Larger workout cards in horizontal layout */
            .workout-card {
                padding: 30px;
            }
            
            .workout-icon {
                font-size: 3em;
            }
            
            .workout-info h3 {
                font-size: 1.5em;
            }
            
            /* Exercise grid optimized for landscape */
            .exercises-grid {
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: 25px;
            }
            
            /* Equipment grid wider */
            .equipment-grid {
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 25px;
            }
            
            /* Larger modal for better visibility */
            .modal-content {
                max-width: 800px;
                padding: 40px;
            }
            
            /* Timer view optimized for landscape */
            .timer {
                padding: 40px;
            }
            
            #timerDisplay {
                font-size: 4.5em;
            }
            
            .timer {
                padding: 30px 25px;
            }
            
            .timer-controls button {
                padding: 14px 24px;
                font-size: 1.05em;
            }
        }

        @media (max-width: 768px) {
            .equipment-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
            
            .nav-tabs {
                overflow-x: auto;
                flex-wrap: nowrap;
            }
            
            .nav-tab {
                white-space: nowrap;
                flex-shrink: 0;
            }
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 1000;
            overflow-y: auto;
            padding: 20px;
        }

        .modal.active {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .modal-content {
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 20px;
        }

        .close-btn {
            background: #e0e0e0;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            font-size: 1.8em;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-btn:hover {
            background: #16a34a;
            color: white;
            transform: rotate(90deg);
        }

        .instructions-list {
            background: #f5f5f5;
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
        }

        .instructions-list h4 {
            color: #16a34a;
            margin-bottom: 15px;
            font-size: 1.2em;
        }

        .instructions-list ol {
            margin-left: 25px;
            line-height: 2;
            font-size: 1.05em;
        }

        .instructions-list li {
            margin-bottom: 10px;
        }

        .tips-box {
            background: #fff3cd;
            border-left: 4px solid #fbbf24;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }

        .tips-box h4 {
            color: #856404;
            margin-bottom: 8px;
        }

        .equipment-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 15px 0;
        }

        .equipment-tag {
            background: #FFF3E0;
            color: #166534;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.9em;
        }

        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .exercises-welcome {
            text-align: center;
            padding: 60px 20px;
        }

        .exercises-welcome h2 {
            color: #16a34a;
            font-size: 2em;
            margin-bottom: 20px;
        }

        .exercises-welcome p {
            color: #666;
            font-size: 1.1em;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .quick-filter-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            max-width: 800px;
            margin: 30px auto;
        }

        .quick-filter-btn {
            background: white;
            border: 2px solid #16a34a;
            color: #16a34a;
            padding: 15px 20px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            font-size: 1em;
        }

        .quick-filter-btn:hover {
            background: #16a34a;
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(22, 163, 74, 0.3);
        }

        .exercises-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 40px;
            flex-wrap: wrap;
        }

        .exercises-stat-item {
            text-align: center;
        }

        .exercises-stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #16a34a;
        }

        .exercises-stat-label {
            color: #666;
            margin-top: 5px;
        }

        .add-to-workout-btn {
            background: #4ade80;
            color: white;
            margin-top: 10px;
        }

        .custom-workout-builder {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 15px;
            margin-top: 20px;
        }

        .selected-exercises {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
        }

        .selected-exercise-item {
            background: white;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .remove-exercise-btn {
            background: #f87171;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
        }

        @media (max-width: 768px) {
            .exercises-grid {
                grid-template-columns: 1fr;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }

            .nav-tabs {
                flex-direction: column;
            }

            .timer-display {
                font-size: 3em;
            }
        }
        
        /* Blacklisted exercises styling */
        .exercise-card.blacklisted {
            opacity: 0.6;
            border: 2px dashed #ef4444;
        }
        
        .exercise-card.blacklisted .exercise-title {
            text-decoration: line-through;
            color: #999;
        }
        
        .blacklist-toggle {
            transition: all 0.3s ease;
        }
        
        .blacklist-toggle:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .blacklist-toggle.active {
            animation: pulse 2s infinite;
        }

        /* Profile Management Styles */
        .avatar-option {
            font-size: 2em;
            padding: 15px;
            text-align: center;
            border: 3px solid #e0e0e0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            background: white;
        }
        
        .avatar-option:hover {
            border-color: #16a34a;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
        }
        
        .avatar-option.selected {
            border-color: #16a34a;
            background: linear-gradient(135deg, #FFF3E0 0%, #FFF3E0 100%);
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }
        
        .profile-card {
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e0e0e0;
            cursor: pointer;
            transition: all 0.3s;
            background: white;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .profile-card:hover {
            border-color: #16a34a;
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
            transform: translateY(-2px);
        }
        
        .profile-card.current {
            border-color: #4ade80;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
        
        .profile-avatar {
            font-size: 3em;
            width: 70px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        }
        
        .profile-info {
            flex: 1;
        }
        
        .profile-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .profile-stats {
            font-size: 0.9em;
            color: #666;
        }

        /* ========================================
           AMÉLIORATIONS CSS COMPLÈTES
           Design moderne et professionnel
        ======================================== */

        /* Variables couleurs */
        :root {
            --color-primary: #16a34a;
            --color-primary-dark: #15803d;
            --color-success: #10b981;
            --color-warning: #f59e0b;
            --color-danger: #ef4444;
        }

        /* Fond moderne */
        body {
            background: #f9fafb !important;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 250px;
            background: linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%);
            z-index: -1;
            pointer-events: none;
        }

        /* Typographie */
        body {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
        }

        /* ========== HEADER ÉPURÉ ========== */
        .header {
            background: white !important;
            padding: 40px 30px !important;
            border-radius: 20px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                        0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            margin-bottom: 30px !important;
            text-align: center !important;
            border: 1px solid rgba(0, 0, 0, 0.05) !important;
            position: relative !important;
            overflow: hidden !important;
        }

        .header::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 100% !important;
            background: linear-gradient(135deg, rgba(22, 163, 74, 0.03) 0%, rgba(34, 197, 94, 0.03) 100%) !important;
            z-index: 0 !important;
        }

        .header > div {
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
        }

        .header div[style*="width: 50px"] {
            display: none !important;
        }

        .header h1 {
            font-size: 3em !important;
            font-weight: 800 !important;
            margin: 0 0 15px 0 !important;
            background: linear-gradient(135deg, var(--color-primary) 0%, #22c55e 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            letter-spacing: -1.5px !important;
            line-height: 1.1 !important;
            text-shadow: none !important;
        }

        .header p {
            font-size: 1.1em !important;
            color: #6b7280 !important;
            font-weight: 500 !important;
            margin: 0 !important;
            letter-spacing: 0.3px !important;
        }

        /* ========== CARDS ========== */
        .card {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            transform: translateY(-2px) !important;
        }

        /* ========== NAVIGATION ========== */
        .nav-tabs {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }

        .nav-tab {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            position: relative !important;
        }

        .nav-tab:hover:not(.active) {
            background: #f3f4f6 !important;
            transform: translateY(-1px) !important;
        }

        .nav-tab.active {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3) !important;
        }

        .nav-tab.active::after {
            content: '' !important;
            position: absolute !important;
            bottom: -6px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 6px !important;
            height: 6px !important;
            background: var(--color-primary) !important;
            border-radius: 50% !important;
        }

        /* ========== BOUTONS ========== */
        .btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            position: relative !important;
            overflow: hidden !important;
        }

        .btn:not(.btn-secondary):not(.btn-danger) {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3) !important;
        }

        .btn:hover:not(.btn-secondary) {
            box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.4), 0 4px 6px -2px rgba(22, 163, 74, 0.2) !important;
            transform: translateY(-2px) !important;
        }

        .btn:active {
            transform: scale(0.98) !important;
        }

        .btn-secondary:hover {
            background: #f3f4f6 !important;
            border-color: var(--color-primary) !important;
            color: var(--color-primary) !important;
        }

        /* ========== PROFILE CARD ========== */
        #profileCard {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            box-shadow: 0 20px 25px -5px rgba(22, 163, 74, 0.3), 0 10px 10px -5px rgba(22, 163, 74, 0.2) !important;
        }

        /* ========== MODALS ========== */
        .modal {
            backdrop-filter: blur(4px) !important;
        }

        .modal-content {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
            animation: slideUp 0.3s ease-out !important;
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .close-btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .close-btn:hover {
            background: var(--color-danger) !important;
            color: white !important;
            transform: rotate(90deg) !important;
        }

        /* ========== EXERCISE CARDS ========== */
        .exercise-card {
            position: relative !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .exercise-card::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 4px !important;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            border-radius: 20px 20px 0 0 !important;
            opacity: 0 !important;
            transition: opacity 0.3s !important;
        }

        .exercise-card:hover::before {
            opacity: 1 !important;
        }

        .exercise-card:hover {
            transform: translateY(-4px) !important;
            border-color: var(--color-primary) !important;
            box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.2), 0 4px 6px -2px rgba(22, 163, 74, 0.1) !important;
        }

        /* ========== PROGRESS BARS ========== */
        .progress-bar-fill {
            position: relative !important;
            overflow: hidden !important;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
        }

        .progress-bar-fill::after {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent) !important;
            animation: shimmer 2s infinite !important;
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        /* ========== INPUTS ========== */
        input[type="text"]:focus,
        input[type="number"]:focus,
        input[type="email"]:focus,
        select:focus,
        textarea:focus {
            border-color: var(--color-primary) !important;
            box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1) !important;
        }

        /* ========== SCROLLBAR ========== */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }

        ::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
            border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--color-primary-dark);
        }

        /* ========== DARK MODE ========== */
        .dark-mode {
            background: #0D0D0D !important;
        }

        .dark-mode .header {
            background: linear-gradient(135deg, #166534 0%, #B33209 100%) !important;
            box-shadow: 0 10px 40px rgba(91, 33, 182, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }

        .dark-mode .header h1 {
            color: white !important;
            text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.7) !important;
        }

        .dark-mode .header p {
            color: rgba(255, 255, 255, 0.9) !important;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
        }

        .dark-mode .card {
            background: #1f2937 !important;
            border-color: #374151 !important;
        }

        .dark-mode .nav-tabs {
            background: #1f2937 !important;
        }

        .dark-mode .nav-tab:hover:not(.active) {
            background: #374151 !important;
        }

        .dark-mode .btn-secondary {
            background: #374151 !important;
            border-color: #4b5563 !important;
        }

        .dark-mode input,
        .dark-mode select,
        .dark-mode textarea {
            background: #374151 !important;
            border-color: #4b5563 !important;
            color: #f9fafb !important;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {
            body::before {
                height: 150px !important;
            }

            .header {
                padding: 30px 20px !important;
            }

            .header h1 {
                font-size: 2.2em !important;
                letter-spacing: -1px !important;
            }

            .header p {
                font-size: 1em !important;
            }

            .card {
                padding: 20px !important;
            }
        }

        @media (max-width: 480px) {
            .header h1 {
                font-size: 1.8em !important;
            }

            .header p {
                font-size: 0.9em !important;
            }
        }
        /* ========== TOAST NOTIFICATIONS ========== */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 100000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }

        .toast {
            backdrop-filter: blur(8px);
            background: white;
            color: #1f2937;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 500px;
            font-weight: 500;
            pointer-events: auto;
            animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border-left: 4px solid #10b981;
        }

        .toast.toast-success {
            border-left-color: #10b981;
        }

        .toast.toast-error {
            border-left-color: #ef4444;
        }

        .toast.toast-warning {
            border-left-color: #f59e0b;
        }

        .toast.toast-info {
            border-left-color: #3b82f6;
        }

        .toast-icon {
            font-size: 1.5em;
            line-height: 1;
            flex-shrink: 0;
        }

        .toast-message {
            flex: 1;
            font-size: 0.95em;
        }

        .toast-close {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 1.5em;
            line-height: 1;
            padding: 0;
            margin-left: 8px;
            flex-shrink: 0;
            transition: color 0.2s;
        }

        .toast-close:hover {
            color: #1f2937;
        }

        .toast.toast-exit {
            animation: toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes toastSlideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes toastSlideOut {
            from {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            to {
                transform: translateX(400px) scale(0.9);
                opacity: 0;
            }
        }

        /* Dark mode for toasts */
        body.dark-mode .toast {
            background: #1A1B20;
            color: #e2e8f0;
            border-color: #252830;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        }

        body.dark-mode .toast-close {
            color: #6b7280;
        }

        body.dark-mode .toast-close:hover {
            color: #f9fafb;
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
            #equipmentSidebar {
                display: none !important;
            }
            
            #exerciseView .card {
                margin-left: 0 !important;
            }
            
            #exerciseView .exercise-progress-list {
                margin-left: 0 !important;
            }
        }
        
        @media (max-width: 900px) {
            #equipmentSidebar {
                position: static !important;
                width: 100% !important;
                margin-bottom: 20px !important;
            }
            
            #exerciseView .card {
                margin-left: 0 !important;
            }
            
            #exerciseView .exercise-progress-list {
                margin-left: 0 !important;
            }
        }
            .toast-container {
                left: 10px;
                right: 10px;
                top: 10px;
            }

            .toast {
                min-width: 0;
                width: 100%;
            }
        }

        
        /* ========== AMÉLIORATIONS VISUELLES EXPERT ========== */
        
        /* Cartes avec gradients et animations */
        .card {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(22, 163, 74, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 48px rgba(22, 163, 74, 0.15);
        }
        
        /* Boutons avec effet de brillance */
        .btn {
            box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }
        
        .btn:hover::before {
            left: 100%;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
        }
        
        /* Timer avec pulsation lumineuse */
        .timer {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #f093fb 100%);
            box-shadow: 0 8px 32px rgba(22, 163, 74, 0.3),
                        inset 0 2px 8px rgba(255, 255, 255, 0.2);
            animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
            0%, 100% {
                box-shadow: 0 8px 32px rgba(22, 163, 74, 0.3),
                            inset 0 2px 8px rgba(255, 255, 255, 0.2);
            }
            50% {
                box-shadow: 0 8px 40px rgba(22, 163, 74, 0.5),
                            inset 0 2px 12px rgba(255, 255, 255, 0.3);
            }
        }
        
        /* Badges avec animation pop */
        .muscle-badge {
            animation: badge-pop 0.3s ease-out;
        }
        
        @keyframes badge-pop {
            0% {
                transform: scale(0.8);
                opacity: 0;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        /* Barre de progression avec brillance */
        .progress-fill {
            animation: progress-shine 2s ease-in-out infinite;
        }
        
        @keyframes progress-shine {
            0% {
                filter: brightness(1);
            }
            50% {
                filter: brightness(1.2);
            }
            100% {
                filter: brightness(1);
            }
        }
        
        /* Exercise cards avec slide au hover */
        .exercise-item {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .exercise-item:hover {
            transform: translateX(8px);
            box-shadow: 0 6px 20px rgba(22, 163, 74, 0.15);
            border-left-width: 6px;
        }
        
        /* Stat boxes avec zoom au hover */
        .stat-box {
            transition: all 0.3s ease;
        }
        
        .stat-box:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 24px rgba(56, 189, 248, 0.2);
        }
        
        /* Icône de completion avec célébration */
        .completion-icon {
            animation: celebration 1s ease-out;
            filter: drop-shadow(0 4px 8px rgba(234, 179, 8, 0.3));
        }
        
        @keyframes celebration {
            0% {
                transform: scale(0) rotate(0deg);
            }
            50% {
                transform: scale(1.2) rotate(180deg);
            }
            100% {
                transform: scale(1) rotate(360deg);
            }
        }
        
        /* Modal avec backdrop blur */
        .modal {
            backdrop-filter: blur(8px);
        }
        
        /* modal-slide-up merged into existing slideUp keyframe */
        
        /* toast-slide-in merged into main .toast block */
        
        /* Tabs avec scale au hover */
        .nav-btn.active {
            transform: scale(1.05);
        }
        
        .nav-btn:hover:not(.active) {
            transform: translateY(-2px);
            background: rgba(22, 163, 74, 0.1);
        }
        
        /* Challenge cards avec scale */
        .challenge-card {
            transition: all 0.3s ease;
        }
        
        .challenge-card:hover {
            transform: scale(1.03);
            box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
        }
        
        /* Loading spinner amélioré */
        .brain-spin {
            animation: rotate-pulse 1.5s ease-in-out infinite;
            display: inline-block;
        }
        
        @keyframes rotate-pulse {
            0%, 100% {
                transform: rotate(0deg) scale(1);
            }
            25% {
                transform: rotate(90deg) scale(1.1);
            }
            50% {
                transform: rotate(180deg) scale(1);
            }
            75% {
                transform: rotate(270deg) scale(1.1);
            }
        }
        
        /* Preparation view ultra premium */
        #preparationView .card {
            background: linear-gradient(135deg, #fafafa 0%, #ffffff 50%, #f5f5f5 100%);
            box-shadow: 0 12px 48px rgba(22, 163, 74, 0.15);
        }
        
        /* Exercise item states */
        .exercise-item.completed {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-left-color: #22c55e;
        }
        
        .exercise-item.current {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-left-color: #3b82f6;
            animation: pulse-current 2s ease-in-out infinite;
        }
        
        @keyframes pulse-current {
            0%, 100% {
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
            }
            50% {
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }
        }
        
        /* Couleurs fixes — violet signature */
        :root {
            --primary-color: #16a34a;
            --primary-dark:  #15803d;
            --primary-light: #FFF3E0;
        }
        
        /* Fireworks Animation */
        .fireworks-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        }
        
        .firework {
            position: absolute;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            animation: firework-explosion 1s ease-out forwards;
        }
        
        @keyframes firework-explosion {
            0% {
                opacity: 1;
                transform: translate(0, 0) scale(1);
            }
            100% {
                opacity: 0;
                transform: translate(var(--tx), var(--ty)) scale(0);
            }
        }
        
        .firework-trail {
            position: absolute;
            width: 3px;
            height: 40px;
            background: linear-gradient(to bottom, transparent, var(--firework-color));
            animation: firework-rise 1s ease-out;
        }
        
        @keyframes firework-rise {
            0% {
                transform: translateY(100vh);
                opacity: 1;
            }
            100% {
                transform: translateY(0);
                opacity: 0;
            }
        }
        
        .celebration-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.5s;
        }
        
        .celebration-message {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 500px;
            animation: scaleIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes scaleIn {
            from {
                transform: scale(0.5);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        /* ========== ACCORDION SECTIONS ========== */
        .accordion-section {
            margin-bottom: 15px;
            border-radius: 12px;
            overflow: hidden;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }
        
        .accordion-section:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .accordion-header {
            padding: 20px 25px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            transition: all 0.3s ease;
            user-select: none;
        }
        
        .accordion-header:hover {
            background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        }
        
        .accordion-header.active {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        }
        
        .accordion-header.active .accordion-title {
            color: white;
        }
        
        .accordion-header.active .accordion-icon {
            color: white;
        }
        
        .accordion-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.3em;
            font-weight: 700;
            color: #334155;
            transition: color 0.3s ease;
        }
        
        .accordion-icon {
            font-size: 1.2em;
            color: #94a3b8;
            transition: all 0.3s ease;
        }
        
        .accordion-header.active .accordion-icon {
            transform: rotate(180deg);
        }
        
        .accordion-body {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease-out, padding 0.4s ease-out;
            padding: 0 25px;
        }
        
        .accordion-body.open {
            max-height: 10000px;
            padding: 25px;
            transition: max-height 0.5s ease-in, padding 0.4s ease-in;
        }
        
        .accordion-content {
            animation: fadeIn 0.4s ease-in;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    


        /* ── DESIGN TOKENS ───────────────────────────────────────── */
        :root {
            --font-main: 'Outfit', -apple-system, sans-serif;

            --color-primary:      #16a34a;
            --color-primary-dark: #15803d;
            --color-primary-light:#FFF3E0;
            --color-accent:       #4ade80;
            --color-success:      #10b981;
            --color-warning:      #f59e0b;
            --color-danger:       #ef4444;

            --bg-body:   #111318;
            --bg-card:   #ffffff;
            --bg-glass:  rgba(255,255,255,0.85);

            --shadow-sm: 0 1px 3px rgba(22,163,74,0.08), 0 1px 2px rgba(0,0,0,0.06);
            --shadow-md: 0 4px 16px rgba(22,163,74,0.12), 0 2px 6px rgba(0,0,0,0.06);
            --shadow-lg: 0 12px 32px rgba(22,163,74,0.18), 0 4px 12px rgba(0,0,0,0.08);
            --shadow-xl: 0 24px 48px rgba(22,163,74,0.22), 0 8px 20px rgba(0,0,0,0.1);

            --radius-sm:  8px;
            --radius-md:  14px;
            --radius-lg:  20px;
            --radius-xl:  28px;
            --radius-full: 9999px;

            --transition: 0.22s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── BASE ────────────────────────────────────────────────── */
        *, *::before, *::after {
            font-family: var(--font-main) !important;
        }

        body {
            font-family: var(--font-main) !important;
            background:
                radial-gradient(ellipse 80% 60% at 20% -10%, rgba(22,163,74,0.18) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 90% 110%, rgba(34,197,94,0.14) 0%, transparent 55%),
                linear-gradient(160deg, #FFF8F5 0%, #FFF3E0 40%, #FFF3E0 100%) !important;
            min-height: 100vh;
        }

        /* ── SCROLLBAR ───────────────────────────────────────────── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(22,163,74,0.3); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(22,163,74,0.55); }

        /* ── HEADER ──────────────────────────────────────────────── */
        .header {
            background:
                linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%) !important;
            border-radius: var(--radius-xl) !important;
            box-shadow: var(--shadow-xl),
                        inset 0 1px 0 rgba(255,255,255,0.25) !important;
            overflow: hidden !important;
            position: relative !important;
        }
        .header::after {
            content: '';
            position: absolute;
            inset: 0;
            background:
                radial-gradient(circle at 85% 30%, rgba(255,255,255,0.12) 0%, transparent 50%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
            pointer-events: none;
        }
        .header h1 {
            font-weight: 900 !important;
            letter-spacing: -1px !important;
        }

        /* ── CARDS ───────────────────────────────────────────────── */
        .card {

            border-radius: var(--radius-lg) !important;
            box-shadow: var(--shadow-md) !important;
            border: 1px solid rgba(22,163,74,0.07) !important;
            transition: box-shadow var(--transition), transform var(--transition) !important;
            margin-bottom: 18px !important;
        }
        .card:hover {
            box-shadow: var(--shadow-lg) !important;
            transform: translateY(-2px) !important;
        }

        /* ── NAV TABS ────────────────────────────────────────────── */
        .card.nav-tabs {
            background: rgba(255,255,255,0.92) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255,255,255,0.8) !important;
            padding: 8px !important;
            gap: 6px !important;
            box-shadow: var(--shadow-md) !important;
            border-radius: var(--radius-lg) !important;
            position: sticky !important;
            top: 12px !important;
            z-index: 100 !important;
        }
        .card.nav-tabs:hover {
            transform: none !important;
        }

        .nav-tab {
            border-radius: var(--radius-md) !important;
            font-weight: 600 !important;
            font-size: 0.92em !important;
            letter-spacing: 0.1px !important;
            padding: 12px 14px !important;
            min-height: 48px !important;
            color: #6b7280 !important;
            transition: all var(--transition) !important;
            position: relative !important;
        }
        .nav-tab:hover:not(.active) {
            background: rgba(22,163,74,0.08) !important;
            color: var(--color-primary) !important;
            transform: translateY(-1px) !important;
        }
        .nav-tab.active {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            color: white !important;
            box-shadow: 0 4px 14px rgba(22,163,74,0.4) !important;
            transform: translateY(-1px) !important;
        }

        /* ── BUTTONS ─────────────────────────────────────────────── */
        .btn {
            font-weight: 700 !important;
            font-size: 1em !important;
            letter-spacing: 0.2px !important;
            border-radius: var(--radius-full) !important;
            min-height: 52px !important;
            padding: 14px 28px !important;
            transition: all var(--transition) !important;
            position: relative !important;
            overflow: hidden !important;
        }
        .btn:not(.btn-secondary):not(.btn-danger) {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            box-shadow: 0 4px 14px rgba(22,163,74,0.35) !important;
        }
        .btn:not(.btn-secondary):not(.btn-danger):hover {
            box-shadow: 0 8px 24px rgba(22,163,74,0.5) !important;
            transform: translateY(-2px) !important;
        }
        .btn:active {
            transform: scale(0.97) !important;
        }
        .btn-secondary {
            background: #f3f4f8 !important;
            color: #374151 !important;
            border: 1.5px solid #e5e7eb !important;
            box-shadow: none !important;
        }
        .btn-secondary:hover {
            background: #e8eaf0 !important;
            border-color: var(--color-primary) !important;
            color: var(--color-primary) !important;
            transform: translateY(-1px) !important;
        }

        /* ── INPUTS & SELECTS ────────────────────────────────────── */
        select, input[type="text"], input[type="number"],
        input[type="email"], input[type="time"], input[type="date"],
        textarea {
            font-family: var(--font-main) !important;
            border: 1.5px solid #e5e7eb !important;
            border-radius: var(--radius-md) !important;
            padding: 13px 16px !important;
            font-size: 1em !important;
            background: #fafafa !important;
            color: #0D0D0D !important;
            transition: all var(--transition) !important;
            min-height: 50px !important;
        }
        select:focus, input:focus, textarea:focus {
            border-color: var(--color-primary) !important;
            background: white !important;
            box-shadow: 0 0 0 3px rgba(22,163,74,0.12) !important;
            outline: none !important;
        }

        /* ── STAT BOXES ──────────────────────────────────────────── */
        .stat-box {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            border-radius: var(--radius-md) !important;
            padding: 22px 16px !important;
            box-shadow: 0 6px 20px rgba(22,163,74,0.3) !important;
            position: relative !important;
            overflow: hidden !important;
        }
        .stat-box::before {
            content: '';
            position: absolute;
            top: -20px; right: -20px;
            width: 80px; height: 80px;
            background: rgba(255,255,255,0.08);
            border-radius: 50%;
        }
        .stat-value {
            font-size: 2.2em !important;
            font-weight: 800 !important;
            letter-spacing: -1px !important;
            line-height: 1 !important;
        }
        .stat-label {
            font-size: 0.82em !important;
            font-weight: 500 !important;
            opacity: 0.85 !important;
            margin-top: 6px !important;
            letter-spacing: 0.3px !important;
        }

        /* ── WORKOUT CARDS ───────────────────────────────────────── */
        .workout-card {
            border-radius: var(--radius-lg) !important;
            border: 1.5px solid rgba(22,163,74,0.1) !important;
            transition: all var(--transition) !important;
        }
        .workout-card:hover {
            border-color: var(--color-primary) !important;
            box-shadow: var(--shadow-lg) !important;
            transform: translateY(-4px) !important;
        }
        .workout-info h3 {
            font-weight: 700 !important;
            letter-spacing: -0.3px !important;
        }

        /* ── EXERCISE CARDS ──────────────────────────────────────── */
        .exercise-card {
            border-radius: var(--radius-md) !important;
            border: 1.5px solid rgba(22,163,74,0.08) !important;
            transition: all var(--transition) !important;
        }
        .exercise-card:hover {
            border-color: var(--color-primary) !important;
            box-shadow: var(--shadow-lg) !important;
            transform: translateY(-4px) !important;
        }

        /* ── ACCORDION ───────────────────────────────────────────── */
        .accordion-section {
            border-radius: var(--radius-lg) !important;
            box-shadow: var(--shadow-sm) !important;
            border: 1px solid rgba(22,163,74,0.08) !important;
            margin-bottom: 12px !important;
            overflow: hidden !important;
            transition: box-shadow var(--transition) !important;
        }
        .accordion-section:hover {
            box-shadow: var(--shadow-md) !important;
        }
        .accordion-header {
            padding: 18px 22px !important;
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%) !important;
            border-bottom: 1px solid rgba(22,163,74,0.06) !important;
            transition: all var(--transition) !important;
        }
        .accordion-header:hover {
            background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%) !important;
        }
        .accordion-header.active {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important;
            border-bottom-color: transparent !important;
            box-shadow: 0 4px 16px rgba(22,163,74,0.3) !important;
        }
        .accordion-title {
            font-size: 1.15em !important;
            font-weight: 700 !important;
            letter-spacing: -0.2px !important;
        }
        .accordion-body.open {
            padding: 22px !important;
        }

        /* ── MODAL ───────────────────────────────────────────────── */
        .modal {
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            background: rgba(15,12,40,0.6) !important;
        }
        .modal-content {
            border-radius: var(--radius-xl) !important;
            box-shadow: var(--shadow-xl) !important;
            border: 1px solid rgba(255,255,255,0.6) !important;
            animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        @keyframes modalIn {
            from { opacity: 0; transform: scale(0.92) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── TOAST ───────────────────────────────────────────────── */
        .toast {
            border-radius: var(--radius-md) !important;
            font-weight: 600 !important;
            font-size: 0.95em !important;
            box-shadow: var(--shadow-lg) !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
        }

        /* ── LABELS & HEADINGS ───────────────────────────────────── */
        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-main) !important;
            letter-spacing: -0.3px !important;
        }

        /* ── BADGES ──────────────────────────────────────────────── */
        .badge-item {
            border-radius: var(--radius-md) !important;
            transition: all var(--transition) !important;
        }
        .badge-item.unlocked {
            box-shadow: var(--shadow-md) !important;
        }
        .badge-item:hover {
            transform: translateY(-3px) !important;
            box-shadow: var(--shadow-lg) !important;
        }

        /* ── QUICK FILTER BUTTONS ────────────────────────────────── */
        .quick-filter-btn {
            border-radius: var(--radius-md) !important;
            font-weight: 600 !important;
            border: 1.5px solid rgba(22,163,74,0.25) !important;
            transition: all var(--transition) !important;
        }
        .quick-filter-btn:hover {
            background: var(--color-primary) !important;
            color: white !important;
            border-color: var(--color-primary) !important;
            box-shadow: 0 4px 14px rgba(22,163,74,0.35) !important;
        }

        /* ── PROGRESS BARS ───────────────────────────────────────── */
        .progress-bar-fill {
            border-radius: var(--radius-full) !important;
            background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%) !important;
        }

        /* ── DARK MODE OVERRIDES ─────────────────────────────────── */
        body.dark-mode {
            background:
                radial-gradient(ellipse 70% 50% at 10% 0%, rgba(22,163,74,0.12) 0%, transparent 60%),
                radial-gradient(ellipse 50% 40% at 95% 100%, rgba(124,58,237,0.1) 0%, transparent 55%),
                linear-gradient(160deg, #0f0e1a 0%, #12101f 50%, #0d0f1c 100%) !important;
        }
        body.dark-mode .card {
            background: rgba(30,28,50,0.95) !important;
            border-color: rgba(22,163,74,0.15) !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
        }
        body.dark-mode .card.nav-tabs {
            background: rgba(20,20,24,0.95) !important;
            border-color: rgba(22,163,74,0.2) !important;
        }
        body.dark-mode .nav-tab {
            color: #9ca3af !important;
        }
        body.dark-mode .nav-tab:hover:not(.active) {
            background: rgba(22,163,74,0.12) !important;
            color: #e2e8f0 !important;
        }
        /* ── DARK MODE GLOBAL — couvre les éléments générés par JS ── */
        body.dark-mode .history-item {
            background: #181A1F !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }
        body.dark-mode .history-item * { color: #e2e8f0 !important; }
        body.dark-mode .history-item [style*="color: #"] { color: #cbd5e1 !important; }
        body.dark-mode .history-item [style*="color:#"] { color: #cbd5e1 !important; }

        body.dark-mode .modal-content {
            background: #1A1B20 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .modal-content h2,
        body.dark-mode .modal-content h3,
        body.dark-mode .modal-content h4 { color: #4ade80 !important; }
        body.dark-mode .modal-content p,
        body.dark-mode .modal-content label { color: #94a3b8 !important; }

        body.dark-mode #exerciseDescriptionBox {
            background: #181A1F !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode #exerciseDescriptionBox li { color: #cbd5e1 !important; }

        body.dark-mode .exercise-card {
            background: #181A1F !important;
            border-color: #252830 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .favorite-workout-card {
            background: #181A1F !important;
            border-color: #252830 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .workout-card {
            background: #181A1F !important;
            border-color: #252830 !important;
        }
        body.dark-mode .progress-item {
            background: #181A1F !important;
            border-color: #252830 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .progress-item.completed { background: #14532d !important; }
        body.dark-mode .progress-item.current { background: #0F1014 !important; }

        body.dark-mode #repsTrackingInputs > div {
            background: linear-gradient(135deg,#0F101430,#1A0A0040) !important;
            border-color: #15803d40 !important;
        }
        body.dark-mode #repsTrackingInputs input {
            background: #181A1F !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }

        body.dark-mode .card.nav-tabs:not([style]) {
            background: rgba(20,20,24,0.97) !important;
        }

        body.dark-mode select,
        body.dark-mode input[type="text"],
        body.dark-mode input[type="number"],
        body.dark-mode input[type="email"],
        body.dark-mode input[type="time"],
        body.dark-mode input[type="date"],
        body.dark-mode textarea {
            background: #181A1F !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }

        body.dark-mode .swap-card { background: #181A1F !important; }
        body.dark-mode .swap-card:hover { background: #2A2C32 !important; }
        body.dark-mode .swap-card-name { color: #e2e8f0 !important; }

        body.dark-mode #completionView .card {
            /* already dark gradient */
        }

        /* ── FIN DARK MODE GLOBAL ─────────────────────────────── */

        /* ── Textes inline #666 illisibles en dark mode ──────────── */
        body.dark-mode [style*="color: #666"],
        body.dark-mode [style*="color:#666"] {
            color: #94a3b8 !important;
        }
        body.dark-mode [style*="color: #999"],
        body.dark-mode [style*="color:#999"] {
            color: #6b7280 !important;
        }
        /* Cards avec fond transparent (ex. cardio sub-cards) — texte lisible */
        body.dark-mode .card[style*="background: transparent"],
        body.dark-mode .card[style*="background:transparent"] {
            color: #e2e8f0 !important;
        }
        body.dark-mode .card[style*="background: transparent"] p,
        body.dark-mode .card[style*="background: transparent"] [style*="color: #666"] {
            color: #94a3b8 !important;
        }
        /* Section cardio container */
        body.dark-mode .card[style*="border: 2px solid #06b6d4"],
        body.dark-mode .card[style*="border: 2px solid #ef4444"],
        body.dark-mode .card[style*="border: 2px solid #f59e0b"],
        body.dark-mode .card[style*="border: 2px solid #10b981"],
        body.dark-mode .card[style*="border: 2px solid #22c55e"] {
            background: rgba(255,255,255,0.03) !important;
            color: #e2e8f0 !important;
        }
        /* Titres colorés dans ces cards restent lisibles */
        body.dark-mode h4[style*="color: #06b6d4"] { color: #22d3ee !important; }
        body.dark-mode h4[style*="color: #ef4444"] { color: #f87171 !important; }
        body.dark-mode h4[style*="color: #f59e0b"] { color: #fbbf24 !important; }
        body.dark-mode h4[style*="color: #10b981"] { color: #34d399 !important; }

        /* ── CLASSES MANQUANTES sans dark override ──────────────────── */
        body.dark-mode .badge-item {
            background: #1A1B20 !important;
            border-color: #252830 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .badge-name { color: #e2e8f0 !important; }

        body.dark-mode .custom-workout-builder {
            background: #1A1B20 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .selected-exercise-item {
            background: #222328 !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }
        body.dark-mode .exercise-progress-list {
            background: #1A1B20 !important;
        }
        body.dark-mode .progress-item {
            background: #222328 !important;
            border-color: #2E2F35 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .progress-item-name  { color: #e2e8f0 !important; }
        body.dark-mode .progress-item.completed .progress-item-name { color: #4ade80 !important; }
        body.dark-mode .progress-item.current .progress-item-name   { color: #4ade80 !important; }
        body.dark-mode .progress-item-duration                      { color: #6b7280 !important; }
        body.dark-mode .progress-item.current .progress-item-duration { color: #4ade80 !important; }
        body.dark-mode .progress-stat-label { color: #94a3b8 !important; }
        body.dark-mode .progress-stats {
            background: rgba(22,163,74,0.08) !important;
            border-color: rgba(22,163,74,0.2) !important;
        }
        body.dark-mode .quick-filter-btn {
            background: #222328 !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }
        body.dark-mode .quick-filter-btn.active {
            background: #16a34a !important;
            color: white !important;
            border-color: #16a34a !important;
        }
        body.dark-mode .exercise-description-box {
            background: #222328 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .graph-tab-btn {
            background: #222328 !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }
        body.dark-mode .graph-tab-btn.active {
            background: #16a34a !important;
            color: white !important;
        }
        body.dark-mode .exercise-detail-card,
        body.dark-mode .exercise-progress-item {
            background: #222328 !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }
        /* Textes #333 inline en dark → blanc */
        body.dark-mode [style*="color: #333"],
        body.dark-mode [style*="color:#333"] {
            color: #e2e8f0 !important;
        }
        body.dark-mode [style*="color: #555"],
        body.dark-mode [style*="color:#555"] {
            color: #94a3b8 !important;
        }

        body.dark-mode .accordion-header {
            background: linear-gradient(135deg, #181A1F 0%, #1A1B20 100%) !important;
            border-bottom-color: rgba(22,163,74,0.1) !important;
        }
        body.dark-mode .accordion-header:hover {
            background: linear-gradient(135deg, #2A2C32 0%, #1E2025 100%) !important;
        }
        body.dark-mode .accordion-title {
            color: #e2e8f0 !important;
        }
        body.dark-mode .accordion-icon {
            color: #16a34a !important;
        }
        body.dark-mode .accordion-section {
            border-color: rgba(22,163,74,0.12) !important;
        }
        body.dark-mode select,
        body.dark-mode input[type="text"],
        body.dark-mode input[type="number"],
        body.dark-mode input[type="time"],
        body.dark-mode textarea {
            background: #181A1F !important;
            border-color: rgba(22,163,74,0.2) !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .btn-secondary {
            background: #181A1F !important;
            border-color: rgba(22,163,74,0.2) !important;
            color: #d1d5db !important;
        }
        body.dark-mode .btn-secondary:hover {
            background: #2A2C32 !important;
            border-color: var(--color-primary) !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .modal-content {
            background: #1A1B20 !important;
            border-color: rgba(22,163,74,0.2) !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .workout-card,
        body.dark-mode .exercise-card {
            background: #181A1F !important;
            border-color: rgba(22,163,74,0.15) !important;
            color: #e2e8f0 !important;
        }

        /* ── UTILS ───────────────────────────────────────────────── */
        .muscle-group, .muscle-badge {
            border-radius: var(--radius-sm) !important;
            font-weight: 600 !important;
        }
        .difficulty-badge {
            border-radius: var(--radius-sm) !important;
            font-weight: 700 !important;
            letter-spacing: 0.3px !important;
        }
        .close-btn {
            border-radius: var(--radius-full) !important;
            transition: all var(--transition) !important;
        }
        .close-btn:hover {
            background: var(--color-danger) !important;
            color: white !important;
            transform: rotate(90deg) scale(1.1) !important;
        }
    


        /* ════════════════════════════════════════════════════════════
           RESPONSIVE — MOBILE & TABLETTE
           ════════════════════════════════════════════════════════════ */

        /* ── MOBILE PORTRAIT (≤ 640px) ─────────────────────────────── */
        @media (max-width: 640px) {
            /* Body — espace en bas pour la nav bar fixe */
            body { padding: 8px 8px 80px !important; font-size: 16px !important; }
            .container { padding: 0 !important; }

            /* ── NAV BAR EN BAS — style app mobile native ── */
            .card.nav-tabs {
                position: fixed !important;
                bottom: 0 !important; left: 0 !important; right: 0 !important;
                top: auto !important;
                z-index: 9999 !important;
                border-radius: 0 !important;
                padding: 4px 2px env(safe-area-inset-bottom, 4px) 2px !important;
                gap: 0 !important;
                display: flex !important;
                flex-wrap: nowrap !important;
                overflow: visible !important;
                box-shadow: 0 -2px 16px rgba(0,0,0,0.12) !important;
                border-top: 1px solid rgba(0,0,0,0.08) !important;
                border-left: none !important; border-right: none !important; border-bottom: none !important;
                margin-bottom: 0 !important;
                background: rgba(255,255,255,0.97) !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
                transition: transform 0.3s cubic-bezier(0.4,0,0.2,1) !important;
            }
            .card.nav-tabs.nav-collapsed {
                transform: translateY(calc(100% - 16px)) !important;
            }
            /* Oreille "poignée" visible même quand collapsed */
            #navCollapseBtn {
                position: absolute !important;
                top: -22px !important; right: 12px !important;
                width: 44px !important; height: 22px !important;
                background: rgba(255,255,255,0.97) !important;
                border: 1px solid rgba(0,0,0,0.08) !important;
                border-bottom: none !important;
                border-radius: 10px 10px 0 0 !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
                cursor: pointer !important; font-size: 0.85em !important;
                box-shadow: 0 -2px 8px rgba(0,0,0,0.06) !important;
            }
            body.dark-mode #navCollapseBtn {
                background: rgba(20,20,24,0.97) !important;
                border-color: rgba(22,163,74,0.2) !important;
            }
            body.dark-mode .card.nav-tabs {
                background: rgba(20,20,24,0.97) !important;
                border-top-color: rgba(22,163,74,0.2) !important;
            }
            .nav-tab {
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 2px !important;
                padding: 5px 2px !important;
                min-height: 50px !important;
                font-size: 0.6em !important;
                border-radius: 10px !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                line-height: 1.1 !important;
            }
            .nav-tab[onclick="toggleDarkMode()"] {
                margin-left: 0 !important;
                flex: 0.6 !important;
            }

            /* Header compact */
            #appHeader {
                padding: 12px 14px !important; border-radius: 14px !important;
                margin-bottom: 10px !important; gap: 12px !important;
            }

            /* Cards */
            .card { padding: 16px 14px !important; border-radius: 14px !important; margin-bottom: 10px !important; }
            .card h2 { font-size: 1.3em !important; margin-bottom: 14px !important; }
            .card h3 { font-size: 1.1em !important; }
            p, li { font-size: 0.95em !important; line-height: 1.55 !important; }

            /* Boutons */
            .btn { min-height: 54px !important; font-size: 1.05em !important; padding: 14px 18px !important; border-radius: 99px !important; }

            /* Stats */
            .stats { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
            .stat-box { padding: 12px 6px !important; }
            .stat-value { font-size: 1.5em !important; letter-spacing: -0.5px !important; }
            .stat-label { font-size: 0.68em !important; }

            /* ═══ SÉANCE MOBILE — VUE ESSENTIELLE UNIQUEMENT ═══ */

            #exerciseView {
                position: fixed !important; inset: 0 !important;
                z-index: 10000 !important; background: #0D0D0D !important;
                display: flex !important; flex-direction: column !important;
                overflow: hidden !important;
            }
            #exerciseView.hidden { display: none !important; }
            /* completionView aussi en plein écran sur mobile */
            #completionView:not(.hidden) {
                position: fixed !important; inset: 0 !important;
                z-index: 10001 !important; overflow-y: auto !important;
                background: #0D0D0D !important;
            }

            /* TOP BAR — quitter + titre */
            #workoutTopBar {
                flex-shrink: 0 !important;
                display: flex !important; align-items: center !important;
                padding: calc(env(safe-area-inset-top,0px) + 8px) 12px 8px !important;
                background: rgba(0,0,0,0.3) !important; gap: 10px !important;
            }
            #workoutTopTitle {
                flex: 1 !important; font-size: 0.72em !important;
                color: rgba(255,255,255,0.45) !important; font-weight: 600 !important;
                overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;
            }
            #quitBtn {
                background: rgba(239,68,68,0.15) !important; color: #fca5a5 !important;
                border: 1px solid rgba(239,68,68,0.35) !important;
                border-radius: 8px !important; padding: 6px 12px !important;
                font-size: 0.78em !important; font-weight: 700 !important;
                min-height: 36px !important; flex-shrink: 0 !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: rgba(239,68,68,0.3) !important;
            }

            /* CARD = zone scrollable */
            #exerciseView .card {
                flex: 1 !important; overflow-y: auto !important; overflow-x: hidden !important;
                margin: 0 !important; border-radius: 0 !important; border: none !important;
                box-shadow: none !important; background: #0D0D0D !important;
                padding: 12px 14px 0 !important;
                display: flex !important; flex-direction: column !important; gap: 0 !important;
            }

            /* CACHER tout ce qui n'est pas essentiel */
            #exerciseView #workoutTypeBadge       { display: none !important; }
            #exerciseView #musclesOverviewBadge   { display: none !important; }
            #exerciseView .next-exercise-preview  { display: none !important; }
            #exerciseView #equipmentBadges        { display: none !important; }
            #exerciseView #miniControls           { display: none !important; }
            #exerciseView #showProgramBtn         { display: none !important; }
            #exerciseView #exerciseProgressListCard { display: none !important; }
            #exerciseView #workoutOptionsBtn      { display: none !important; }
            #exerciseView #warmupSetsRow          { display: none !important; }

            /* Instructions — VISIBLES sur mobile, collapsibles */
            #exerciseView .exercise-description-box {
                display: block !important;
                margin-top: 10px !important;
            }
            /* Lien toggle instructions — visible */
            #exerciseView #showInstructionsLink {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                padding: 8px 14px !important;
                background: rgba(255,255,255,0.06) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 10px !important;
                font-size: 0.82em !important;
                color: #94a3b8 !important;
                cursor: pointer !important;
                margin-top: 6px !important;
            }

            /* Barre de progression — très fine */
            #exerciseView .progress-bar {
                height: 3px !important; border-radius: 0 !important;
                margin: 0 -14px 10px !important; background: rgba(255,255,255,0.1) !important;
            }

            /* TIMER ZONE */
            #exerciseView .timer {
                text-align: center !important; padding: 0 !important;
                margin-bottom: 8px !important; background: none !important;
                border-radius: 0 !important; box-shadow: none !important;
                flex-shrink: 0 !important;
            }
            #exerciseView .exercise-number {
                font-size: 0.72em !important; color: rgba(255,255,255,0.4) !important;
                margin-bottom: 4px !important; letter-spacing: 0.5px !important;
            }
            #exerciseView .exercise-name {
                font-size: 1.55em !important; font-weight: 900 !important;
                color: white !important; line-height: 1.15 !important;
                margin-bottom: 5px !important;
            }
            #exerciseView #muscleBadge {
                font-size: 0.72em !important; padding: 3px 10px !important;
                margin-top: 0 !important; margin-bottom: 6px !important;
            }
            #exerciseView .timer-display {
                font-size: 3.2em !important; margin: 6px 0 8px !important; background: none !important; padding: 0 !important; border-radius: 0 !important;
                letter-spacing: -2px !important; font-weight: 900 !important;
            }

            /* ZONE REPS — essentiel seulement */
            #exerciseView #repsTrackingInputs {
                max-width: 100% !important; margin: 0 0 8px !important; flex-shrink: 0 !important;
            }
            #exerciseView #repsTrackingInputs > div {
                padding: 10px 12px !important; border-radius: 12px !important;
                background: rgba(22,163,74,0.08) !important;
                border: 1.5px solid rgba(22,163,74,0.2) !important;
            }
            #exerciseView #setIndicator { font-size: 0.85em !important; margin-bottom: 8px !important; }
            #exerciseView #lastSetsHistory { font-size: 0.72em !important; }
            #exerciseView #weightSuggestionBadge { font-size: 0.72em !important; }
            #exerciseView #completedSetsLog { margin-bottom: 6px !important; }

            /* Inputs reps/poids */
            #exerciseView #quickRepsInput,
            #exerciseView #quickWeightInput {
                font-size: 1.7em !important; padding: 8px !important;
                min-height: 52px !important; border-radius: 8px !important;
            }

            /* Bouton Compléter */
            #exerciseView #completeSetBtn {
                padding: 14px !important; font-size: 1.05em !important;
                min-height: 52px !important; border-radius: 12px !important;
                margin-bottom: 0 !important;
            }

            /* Cacher RPE et repos — dans le menu ⋯ */
            #exerciseView #inlineRPEBtns,
            #exerciseView #inlineRestSelect,
            #exerciseView #exerciseNotesSection   { display: none !important; }
            #exerciseView #repsTrackingInputs .timer-controls-row { display: none !important; }
            /* Cacher le hint "laissez vide" */
            #exerciseView #repsTrackingInputs > div > div:last-child:not([id]) { display: none !important; }

            /* SVG exercice */
            #exerciseView .exercise-timer-images {
                flex-shrink: 0 !important; gap: 8px !important; padding: 4px 0 6px !important;
                justify-content: center !important;
            }
            #exerciseView .exercise-timer-images svg { max-height: 120px !important; }

            /* BARRE BOUTONS EN BAS — sticky */
            #exerciseView .timer-controls {
                position: sticky !important; bottom: 0 !important; flex-shrink: 0 !important;
                background: #0D0D0D !important;
                border-top: 1px solid rgba(255,255,255,0.08) !important;
                padding: 8px 10px calc(8px + env(safe-area-inset-bottom,0px)) !important;
                margin: auto -14px 0 !important;
                gap: 6px !important; flex-wrap: nowrap !important; z-index: 50 !important;
            }
            /* Taille boutons définie plus bas dans le bloc Workout View */

            /* Timer workout rules moved to workout section */
            #gameNavTab { display: none; } /* Affiché par JS quand mode jeu activé */
            #gameNavTab { font-size: 0.6em !important; }

            /* Liste programme collapsible */
            #exerciseProgressListCard { padding: 10px 12px !important; margin-bottom: 6px !important; }
            #exerciseProgressListCard h4 { font-size: 0.85em !important; margin: 0 !important; }
            #progressListBody { overflow: hidden; transition: max-height 0.3s ease; }
            #progressListBody.collapsed { max-height: 0 !important; overflow: hidden !important; }

            /* Images exercice */
            .exercise-timer-images { gap: 10px !important; max-width: 100% !important; }

            /* Inputs — 16px pour éviter zoom iOS */
            select, input[type="text"], input[type="number"], input[type="email"],
            input[type="time"], input[type="date"], textarea {
                font-size: 16px !important; min-height: 50px !important;
                padding: 13px 14px !important; border-radius: 10px !important;
            }

            /* Modals bottom sheet */
            .modal { align-items: flex-end !important; padding: 0 !important; }
            .modal-content {
                border-radius: 20px 20px 0 0 !important; max-height: 90vh !important;
                padding: 20px 16px calc(30px + env(safe-area-inset-bottom, 0px)) !important;
            }

            /* Grilles */
            .exercises-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
            .equipment-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
            .filters { grid-template-columns: 1fr !important; gap: 10px !important; }

            /* Workout cards */
            .workout-card { padding: 16px !important; }
            .workout-icon { font-size: 1.8em !important; }
            .workout-info h3 { font-size: 1.1em !important; }
            .workout-meta { font-size: 0.85em !important; gap: 10px !important; flex-wrap: wrap !important; }

            /* Accordion */
            .accordion-header { padding: 15px 14px !important; min-height: 56px !important; }
            .accordion-title { font-size: 1em !important; gap: 10px !important; }
            .accordion-body.open { padding: 14px 12px !important; }

            /* Reps tracking */
            #repsTrackingInputs { max-width: 100% !important; }

            /* Toasts — au-dessus de la nav bar */
            .toast-container { bottom: 80px !important; right: 8px !important; left: 8px !important; top: auto !important; }
            .toast { font-size: 0.92em !important; padding: 12px 14px !important; min-width: unset !important; width: 100% !important; }

            /* Badges */
            .difficulty-badge { font-size: 0.75em !important; padding: 4px 10px !important; }
            .muscle-group { font-size: 0.8em !important; }
            #muscleBadge { font-size: 0.85em !important; padding: 6px 12px !important; }

            /* Equipment items */
            .equipment-item { padding: 12px 8px !important; }

            /* ════════════════════════════════
               WORKOUT VIEW — MOBILE OPTIMISÉ
               ════════════════════════════════ */

            /* Zone timer — fond sombre neutre, pas de gradient orange */
            #exerciseView .timer {
                background: rgba(255,255,255,0.04) !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                border-radius: 18px !important;
                padding: 20px 14px 18px !important;
                margin-bottom: 12px !important;
                box-shadow: none !important;
            }

            /* Barre de progression */
            #exerciseView .progress-bar { height: 8px !important; margin-bottom: 12px !important; }

            /* Numéro exercice */
            #exerciseView .exercise-number {
                font-size: 0.78em !important; color: rgba(255,255,255,0.45) !important;
                margin-bottom: 6px !important; letter-spacing: 0.5px !important; text-transform: uppercase !important;
            }

            /* Nom exercice — grand et lisible */
            #exerciseView .exercise-name {
                font-size: 1.55em !important; font-weight: 800 !important;
                color: #ffffff !important; line-height: 1.2 !important;
                margin-bottom: 8px !important;
            }

            /* Badge muscle */
            #muscleBadge {
                background: rgba(22,163,74,0.15) !important;
                border: 1px solid rgba(22,163,74,0.3) !important;
                color: #4ade80 !important; font-size: 0.82em !important;
                padding: 5px 12px !important; margin-top: 6px !important;
            }

            /* Timer display — GRAND, juste le chiffre */
            #exerciseView .timer-display {
                font-size: 4.8em !important; font-weight: 900 !important;
                background: none !important; padding: 0 !important; border-radius: 0 !important;
                color: #ffffff !important; margin: 10px 0 !important;
                letter-spacing: -2px !important;
            }

            /* "Prochain exercice" */
            #nextExercisePreview {
                position: relative !important; top: auto !important; right: auto !important;
                background: rgba(255,255,255,0.06) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 10px !important; padding: 8px 12px !important;
                max-width: 100% !important; text-align: center !important;
                margin: 8px auto 0 !important;
            }
            .next-exercise-label { color: rgba(255,255,255,0.5) !important; }
            .next-exercise-name  { color: #e2e8f0 !important; font-size: 0.85em !important; }

            /* Images SVG — côte à côte */
            .exercise-timer-images {
                flex-direction: row !important; gap: 8px !important;
                margin: 10px auto !important; padding: 0 !important; max-width: 100% !important;
            }
            .exercise-timer-images > div { flex: 1 !important; min-width: 0 !important; }
            .exercise-timer-images > div > div { max-width: 100% !important; width: 100% !important; }
            .exercise-timer-images > div:nth-child(2) {
                flex: 0 0 auto !important; font-size: 1.4em !important;
                color: rgba(255,255,255,0.4) !important; align-self: center !important;
            }

            /* Contrôles en bas — boutons compacts */
            #exerciseView .timer-controls {
                gap: 6px !important;
                margin-top: 8px !important;
                flex-wrap: nowrap !important;
            }
            #exerciseView .timer-controls .btn {
                flex: 1 !important;
                min-height: 44px !important;
                font-size: 0.82em !important;
                font-weight: 700 !important;
                border-radius: 12px !important;
                padding: 8px 6px !important;
                white-space: nowrap !important;
            }
            #pauseBtn  { background: rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; border: 1px solid rgba(255,255,255,0.2) !important; box-shadow: none !important; }
            #exerciseView .timer-controls .btn-secondary { background: #10b981 !important; color: white !important; border: none !important; }
            #swapBtn { font-size: 0.78em !important; }

            /* Progress list */
            .exercise-progress-list { padding: 14px !important; }
            .progress-stat-value { font-size: 1.6em !important; }
            .progress-stat-label { font-size: 0.7em !important; }

            /* Reps tracking */
            #repsTrackingInputs > div { padding: 14px !important; border-radius: 14px !important; }
            #quickRepsInput, #quickWeightInput { font-size: 1.6em !important; padding: 10px !important; }

            /* ── NAV TABS — texte lisible dark mode ─────────────────── */
            .nav-tab { color: #6b7280 !important; }
            .nav-tab.active { color: #16a34a !important; }
            body.dark-mode .card.nav-tabs { background: rgba(18,18,22,0.97) !important; }
            body.dark-mode .nav-tab { color: #6b7280 !important; }
            body.dark-mode .nav-tab.active { color: #16a34a !important; }
            body.dark-mode .nav-tab:hover:not(.active) { color: #e2e8f0 !important; }
        }

            /* ── REST OVERLAY — identique bureau, adapté mobile ── */
            #restOverlay {
                padding: calc(env(safe-area-inset-top,12px) + 24px) 20px
                         calc(env(safe-area-inset-bottom,0px) + 24px) !important;
            }
            #restCountDisplay { font-size: clamp(4.5rem, 28vw, 7rem) !important; }
            #restBtns { max-width: 100% !important; }
            #restNextCard { max-width: 100% !important; }
            .rest-btn-adj { font-size: 0.85em !important; padding: 12px 0 !important; }
            #restSkipBtn { font-size: 0.95em !important; }

            /* Instructions — YouTube btn visible */
            #workoutYoutubeBtn { display: inline-flex !important; }
            #exerciseDescriptionBox {
                background: rgba(255,255,255,0.05) !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                border-radius: 14px !important; padding: 14px !important;
                margin-top: 10px !important; margin-bottom: 10px !important;
            }
            #exerciseDescriptionBox h4 {
                font-size: 0.9em !important; margin-bottom: 8px !important;
                color: #e2e8f0 !important;
            }
            #exerciseDescriptionBox ul {
                margin-left: 14px !important; font-size: 0.86em !important;
                line-height: 1.6 !important; color: #94a3b8 !important;
            }
            #exerciseDescriptionBox li { color: #94a3b8 !important; }

        /* ── TABLETTE (641–1024px) ───────────────────────────────── */
        @media (min-width: 641px) and (max-width: 1024px) {
            body { padding: 12px 12px 20px !important; font-size: 16px !important; }
            #appHeader { padding: 18px 22px !important; gap: 16px !important; }

            .card.nav-tabs {
                flex-wrap: nowrap !important; overflow-x: auto !important; overflow-y: hidden !important;
                padding: 8px !important; gap: 6px !important; top: 10px !important; scrollbar-width: none;
            }
            .card.nav-tabs::-webkit-scrollbar { display: none; }
            .nav-tab { font-size: 0.9em !important; padding: 12px 14px !important; min-height: 48px !important; white-space: nowrap !important; }

            .card { padding: 22px 20px !important; border-radius: 16px !important; }
            .card h2 { font-size: 1.4em !important; }
            .card h3 { font-size: 1.2em !important; }

            .btn { min-height: 54px !important; font-size: 1.05em !important; }

            .stats { grid-template-columns: repeat(3, 1fr) !important; gap: 14px !important; }
            .stat-value { font-size: 2em !important; }

            .timer-display { font-size: 4em !important; }
            .exercise-name { font-size: 1.5em !important; font-weight: 700 !important; }

            .exercises-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .equipment-grid { grid-template-columns: repeat(3, 1fr) !important; }

            select, input[type="text"], input[type="number"], input[type="email"], input[type="time"] {
                font-size: 16px !important; min-height: 50px !important;
            }

            .accordion-title { font-size: 1.15em !important; }
            .accordion-header { min-height: 58px !important; }
        }

        /* Bouton dark mode — caché partout (mode sombre forcé) */
        .nav-tab[onclick="toggleDarkMode()"] { display: none !important; }

        /* ══════════════════════════════════════════════════════
           🎨 PALETTE MODE SOMBRE — COULEURS AGRÉABLES AUX YEUX
           Fini le bleu clair agressif — couleurs douces et profondes
        ═══════════════════════════════════════════════════════ */

        /* Fond global profond, teinte indigo foncé */
        body.dark-mode {
            background: linear-gradient(145deg, #0D0D0D 0%, #111318 100%) !important;
            color: #d1d5db !important;
        }

        /* Cards — fond moyen lisible, contraste suffisant */
        body.dark-mode .card {
            background: #1A1B20 !important;
            color: #e2e8f0 !important;
            border: 1px solid #252830 !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
        }

        /* Nav */
        body.dark-mode .nav-tabs {
            background: #1E2025 !important;
            border: 1px solid #252830 !important;
        }
        body.dark-mode .nav-tab {
            color: #94a3b8 !important;
        }
        body.dark-mode .nav-tab:hover:not(.active) {
            background: #252830 !important;
            color: #4ade80 !important;
        }
        body.dark-mode .nav-tab.active {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
            color: white !important;
        }

        /* Bouton primaire — violet profond, pas cyan agressif */
        body.dark-mode .btn:not(.btn-secondary) {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
        }

        /* Bouton secondaire */
        body.dark-mode .btn-secondary {
            background: #252830 !important;
            color: #4ade80 !important;
            border: 1px solid #2E2F35 !important;
        }

        /* Textes courants */
        body.dark-mode h1, body.dark-mode h2, body.dark-mode h3,
        body.dark-mode h4, body.dark-mode h5 {
            color: #f1f5f9 !important;
        }
        body.dark-mode p, body.dark-mode span, body.dark-mode label,
        body.dark-mode li, body.dark-mode div {
            color: inherit;
        }

        /* Inputs — fond intermédiaire pour lisibilité */
        body.dark-mode input,
        body.dark-mode select,
        body.dark-mode textarea {
            background: #1E2025 !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }
        body.dark-mode input::placeholder { color: #64748b !important; }

        /* Modales */
        body.dark-mode .modal-content {
            background: #1E2025 !important;
            color: #e2e8f0 !important;
            border: 1px solid #252830 !important;
        }

        /* Timer d\'entraînement — fond violet sombre, PAS cyan */
        body.dark-mode .timer {
            background: linear-gradient(145deg, #0D0D0D 0%, #111318 100%) !important;
        }
        body.dark-mode #timerDisplay {
            color: #ffffff !important;
            background: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
        }
        body.dark-mode .timer-display {
            color: #ffffff !important;
            background: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
        }

        /* Suppression complète du bleu clair agressif — remplacé par violet doux */
        body.dark-mode [style*="color: #06b6d4"],
        body.dark-mode [style*="color:#06b6d4"],
        body.dark-mode [style*="color: #0ea5e9"],
        body.dark-mode [style*="color:#0ea5e9"],
        body.dark-mode [style*="color: #38bdf8"],
        body.dark-mode [style*="color:#38bdf8"],
        body.dark-mode [style*="color: #0284c7"],
        body.dark-mode [style*="color:#0284c7"] {
            color: #4ade80 !important;
        }
        /* Remplacer les fonds cyan/bleu vif par des fonds violets doux */
        body.dark-mode [style*="background: #06b6d4"],
        body.dark-mode [style*="background:#06b6d4"],
        body.dark-mode [style*="background: #0ea5e9"],
        body.dark-mode [style*="background: linear-gradient(135deg, #06b6d4"],
        body.dark-mode [style*="background:linear-gradient(135deg, #06b6d4"],
        body.dark-mode [style*="background: linear-gradient(135deg, #0284c7"],
        body.dark-mode [style*="border: 2px solid #06b6d4"],
        body.dark-mode [style*="border:2px solid #06b6d4"],
        body.dark-mode [style*="border-left: 4px solid #06b6d4"],
        body.dark-mode [style*="border-color: #06b6d4"] {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
            border-color: #16a34a !important;
        }
        /* Fonds clairs cyan → fonds sombres violets */
        body.dark-mode [style*="background: #e0f2fe"],
        body.dark-mode [style*="background:#e0f2fe"],
        body.dark-mode [style*="background: #bae6fd"],
        body.dark-mode [style*="background: #f0f9ff"] {
            background: #0F1014 !important;
        }

        /* ── OVERRIDES GLOBAUX DARK MODE — fonds blancs/crème inline ── */

        /* Tous les background:white inline */
        body.dark-mode [style*="background: white"],
        body.dark-mode [style*="background:white"] {
            background: #1A1B20 !important;
            color: #e2e8f0 !important;
        }
        /* Fonds crème/pêche clairs (FFF3E0, FFF8F5, fff4e6, fff8dc, fafafa…) */
        body.dark-mode [style*="background: #FFF3E0"],
        body.dark-mode [style*="background:#FFF3E0"],
        body.dark-mode [style*="background: #fff4e6"],
        body.dark-mode [style*="background:#fff4e6"],
        body.dark-mode [style*="background: #fff8dc"],
        body.dark-mode [style*="background:#fff8dc"],
        body.dark-mode [style*="background: #FFF8F5"],
        body.dark-mode [style*="background:#FFF8F5"] {
            background: rgba(22,163,74,0.1) !important;
            color: #e2e8f0 !important;
        }
        /* Gradient linéaire FFF3E0/FFF3E0 (peach solid) → warm dark */
        body.dark-mode [style*="background: linear-gradient(135deg, #FFF3E0 0%, #FFF3E0"],
        body.dark-mode [style*="background:linear-gradient(135deg,#FFF3E0"] {
            background: rgba(22,163,74,0.08) !important;
        }
        /* Fonds blancs/gris clairs courants */
        body.dark-mode [style*="background: #f8fafc"],
        body.dark-mode [style*="background:#f8fafc"],
        body.dark-mode [style*="background: #f9fafb"],
        body.dark-mode [style*="background:#f9fafb"],
        body.dark-mode [style*="background: #f5f5f5"],
        body.dark-mode [style*="background:#f5f5f5"],
        body.dark-mode [style*="background: #f3f4f6"],
        body.dark-mode [style*="background:#f3f4f6"] {
            background: #222328 !important;
            color: #e2e8f0 !important;
        }
        /* Fonds verts très clairs (e6ffe6, d4f4dd, dcfce7) → dark vert */
        body.dark-mode [style*="background: #e6ffe6"],
        body.dark-mode [style*="background:#e6ffe6"],
        body.dark-mode [style*="background: #d4f4dd"],
        body.dark-mode [style*="background: #dcfce7"],
        body.dark-mode [style*="background: linear-gradient(135deg, #e6ffe6"],
        body.dark-mode [style*="background: rgba(34,197,94,0.1)"] {
            background: rgba(34,197,94,0.12) !important;
        }
        /* Fonds bleus très clairs (f0f9ff, dbeafe, bfdbfe, e0f2fe) → dark neutre */
        body.dark-mode [style*="background: #f0f9ff"],
        body.dark-mode [style*="background: #dbeafe"],
        body.dark-mode [style*="background: #bfdbfe"],
        body.dark-mode [style*="background: linear-gradient(135deg, #f0f9ff"],
        body.dark-mode [style*="background: linear-gradient(135deg,#f0f9ff"] {
            background: rgba(6,182,212,0.1) !important;
        }
        /* Boutons "rateDifficulty" qui ont background:white et reviennent à white au mouseout */
        body.dark-mode button[style*="background: white"][style*="border: 2px solid #"],
        body.dark-mode button[style*="background:white"][style*="border:2px solid #"] {
            background: rgba(255,255,255,0.06) !important;
        }
        /* Champs input dans cards blancs */
        body.dark-mode input[style*="background: #f8fafc"],
        body.dark-mode input[style*="background:#f8fafc"] {
            background: #1A1B20 !important;
            color: #e2e8f0 !important;
            border-color: #252830 !important;
        }
        /* Recovery warnings CSS classes */
        body.dark-mode .recovery-warning.medium {
            background: rgba(245,158,11,0.12) !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .recovery-warning.low {
            background: rgba(6,182,212,0.1) !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .recovery-warning {
            color: #e2e8f0 !important;
        }
        /* fed7aa (orange clair) → orange translucide sombre */
        body.dark-mode [style*="border: 2px solid #fed7aa"],
        body.dark-mode [style*="border:2px solid #fed7aa"],
        body.dark-mode [style*="background: #fed7aa"] {
            border-color: rgba(245,158,11,0.4) !important;
        }
        /* Graphiques chart containers */
        body.dark-mode [style*="background: white"][style*="border-radius: 12px"][style*="height"],
        body.dark-mode [style*="background: white"][style*="border-radius: 12px"][style*="padding: 15px"] {
            background: #1A1B20 !important;
        }
        /* AI card generated inline */
        body.dark-mode [style*="background:linear-gradient(135deg,#f0f9ff"] {
            background: rgba(6,182,212,0.1) !important;
            border-color: #06b6d4 !important;
        }

        /* Éléments exercise card en dark */
        body.dark-mode .exercise-card,
        body.dark-mode .workout-card,
        body.dark-mode .equipment-item {
            background: #1A1B20 !important;
            border-color: #252830 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .exercise-card:hover,
        body.dark-mode .workout-card:hover {
            border-color: #16a34a !important;
            box-shadow: 0 8px 24px rgba(22,163,74,0.3) !important;
        }

        /* Stat boxes */
        body.dark-mode .stat-box {
            background: linear-gradient(135deg, #1A1B20 0%, #166534 100%) !important;
        }

        /* History items */
        body.dark-mode .history-item {
            background: #1A1B20 !important;
            border-left-color: #15803d !important;
        }

        /* Texte accentué — violet doux au lieu de bleu clair */
        body.dark-mode .accent,
        body.dark-mode [style*="color: #16a34a"],
        body.dark-mode [style*="color:#16a34a"] {
            color: #4ade80 !important;
        }

        /* Fond de page workout (timer) */
        body.dark-mode #exerciseView .card,
        body.dark-mode .timer-container {
            background: linear-gradient(145deg, #0D0D0D 0%, #111318 100%) !important;
        }

        /* Badges exercices */
        body.dark-mode .difficulty-badge {
            opacity: 0.9 !important;
        }

        /* Accordéons */
        body.dark-mode .accordion-header {
            background: #252830 !important;
            color: #4ade80 !important;
        }
        body.dark-mode .accordion-body {
            background: #1E2025 !important;
        }

        /* Barre de progression */
        body.dark-mode .progress-bar {
            background: #252830 !important;
        }

        /* Repos — fond vert sombre au lieu de vert criard */

        /* Toast */
        body.dark-mode .toast {
            background: #252830 !important;
            color: #f1f5f9 !important;
            border: 1px solid #2E2F35 !important;
        }

        /* Weekly plan days */
        body.dark-mode .weekly-plan-day {
            background: #1A1B20 !important;
            border-color: #252830 !important;
        }
        body.dark-mode .weekly-plan-day strong { color: #f1f5f9 !important; }
        body.dark-mode .weekly-plan-day .today {
            border-left-color: #4ade80 !important;
            background: #1A1B20 !important;
        }

        /* Exercices instructions */
        body.dark-mode .instructions-list li {
            background: #252830 !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .tips-box {
            background: #252830 !important;
            color: #e2e8f0 !important;
        }

        /* RPE boutons */
        body.dark-mode .rpe-button {
            background: #1A1B20 !important;
            border-color: #252830 !important;
            color: #e2e8f0 !important;
        }

        /* Boutons de notation RPE (1-10) */
        .rpe-btn {
            padding: 15px 10px;
            border-radius: 10px;
            border: 2px solid var(--rpe-color);
            background: transparent;
            cursor: pointer;
            font-size: 1.2em;
            font-weight: 700;
            color: var(--rpe-color);
            transition: background 0.18s, color 0.18s;
            min-width: 44px;
        }
        .rpe-btn:hover, .rpe-btn:active {
            background: var(--rpe-color);
            color: white;
        }

        /* Profile card */
        body.dark-mode #profileCard {
            background: linear-gradient(160deg, #111318 0%, #1A1B20 50%, #1A0A00 100%) !important;
        }

        /* Scrollbars */
        body.dark-mode ::-webkit-scrollbar { width: 6px; height: 6px; }
        body.dark-mode ::-webkit-scrollbar-track { background: #0D0D0D; }
        body.dark-mode ::-webkit-scrollbar-thumb { background: #2E2F35; border-radius: 3px; }
        body.dark-mode ::-webkit-scrollbar-thumb:hover { background: #15803d; }

        /* ── TOUCH : zones cliquables agrandies ─────────────────────── */
        @media (pointer: coarse) {
            .btn { min-height: 54px !important; }
            .nav-tab { min-height: 46px !important; }
            .close-btn { width: 52px !important; height: 52px !important; font-size: 1.6em !important; }
            .accordion-header { min-height: 58px !important; cursor: pointer !important; }
            select, input { min-height: 50px !important; }
            a, button { -webkit-tap-highlight-color: rgba(22,163,74,0.15); }
        }
    


        /* ── SWAP EXERCISE MODAL ─────────────────────────────────── */
        #swapModal {
            position: fixed; inset: 0; z-index: 99997;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            display: none; align-items: flex-end; justify-content: center;
        }
        #swapModal.active { display: flex; }
        #swapModalBox {
            background: #ffffff;
            border-radius: 24px 24px 0 0;
            width: 100%; max-width: 680px;
            max-height: 88vh;
            overflow-y: auto;
            padding: 0 0 32px 0;
            animation: slideUpSheet 0.3s cubic-bezier(0.34,1.2,0.64,1);
            box-shadow: 0 -8px 40px rgba(0,0,0,0.25);
        }
        @keyframes slideUpSheet {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
        }
        .swap-handle {
            width: 40px; height: 4px; border-radius: 99px;
            background: #d1d5db; margin: 12px auto 0;
        }
        .swap-header {
            padding: 16px 20px 12px;
            border-bottom: 1px solid #f0f0f0;
            position: sticky; top: 0; background: white; z-index: 1;
        }
        .swap-section-title {
            font-size: 0.72em; font-weight: 700; text-transform: uppercase;
            letter-spacing: 1px; color: #9ca3af; padding: 12px 20px 6px;
        }
        .swap-card {
            display: flex; align-items: center; gap: 14px;
            padding: 14px 20px; cursor: pointer;
            transition: background 0.15s;
            border-bottom: 1px solid #f9f9f9;
        }
        .swap-card:hover { background: #FFF3E0; }
        .swap-card:active { background: #FFF3E0; }
        .swap-card-img {
            width: 56px; height: 56px; border-radius: 12px;
            background: linear-gradient(135deg,#1A0A00,#166534);
            flex-shrink: 0; overflow: hidden;
        }
        .swap-card-img svg { width: 100%; height: 100%; }
        .swap-card-info { flex: 1; min-width: 0; }
        .swap-card-name {
            font-weight: 700; font-size: 0.97em;
            color: #0F1014; margin-bottom: 3px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .swap-card-meta {
            font-size: 0.8em; color: #6b7280;
            display: flex; gap: 8px; flex-wrap: wrap;
        }
        .swap-badge {
            padding: 2px 8px; border-radius: 99px;
            font-size: 0.78em; font-weight: 600;
        }
        .swap-badge-same  { background: #d1fae5; color: #065f46; }
        .swap-badge-other { background: #fef3c7; color: #92400e; }
        .swap-badge-diff  { background: #fee2e2; color: #991b1b; }
        .swap-badge-easier { background: #FFF3E0; color: #166534; }
        .swap-empty {
            text-align: center; padding: 32px 20px; color: #9ca3af;
        }
        body.dark-mode #swapModalBox {
            background: #181A1F;
        }
        body.dark-mode .swap-header { background: #181A1F; border-color: #252830; }
        body.dark-mode .swap-card { border-color: #2A2C32; }
        body.dark-mode .swap-card:hover { background: #2A2C32; }
        body.dark-mode .swap-card-name { color: #e2e8f0; }
        body.dark-mode .swap-card-meta { color: #94a3b8; }
        body.dark-mode .swap-section-title { color: #16a34a; }
        body.dark-mode .swap-handle { background: #4b5563; }
    


        /* ── ANIMATION RESPIRATION (repos) ─────────────────────── */
        /* ── Lisibilité textes dans le tracker sur fond sombre ── */
        @media (max-width: 640px) {
            /* setIndicator */
            #exerciseView #setIndicator { color: #4ade80 !important; }

            /* Historique dernière séance */
            #exerciseView #lastSetsHistory {
                background: rgba(22,163,74,0.15) !important;
                border-color: rgba(22,163,74,0.3) !important;
                color: #4ade80 !important;
            }
            #exerciseView #lastSetsHistory span {
                background: rgba(255,255,255,0.12) !important;
                color: rgba(255,255,255,0.85) !important;
            }

            /* Suggestion poids */
            #exerciseView #weightSuggestionBadge {
                font-weight: 700 !important;
            }

            /* Label difficulté RPE */
            #exerciseView #inlineRPEBtns {
                background: transparent !important;
            }

            /* Label "Difficulté" et "Repos" textes */
            #exerciseView #repsTrackingInputs .timer-controls ~ div,
            #exerciseView #repsTrackingInputs > div > div > div[style*="0.72em"] {
                color: rgba(255,255,255,0.65) !important;
            }

            /* Hint "Laissez vide" */
            #exerciseView #repsTrackingInputs p {
                color: rgba(255,255,255,0.45) !important;
                background: rgba(255,255,255,0.06) !important;
            }

            /* Série complétée log */
            #exerciseView #completedSetsLog {
                color: rgba(255,255,255,0.8) !important;
            }
            #exerciseView #completedSetsLog > div {
                background: rgba(255,255,255,0.08) !important;
                border-color: rgba(255,255,255,0.12) !important;
                color: rgba(255,255,255,0.85) !important;
            }
        }


        /* ── Transition exercice ── */
        @keyframes slideInRight {
            from { opacity:0; transform:translateX(40px); }
            to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideOutLeft {
            from { opacity:1; transform:translateX(0); }
            to   { opacity:0; transform:translateX(-40px); }
        }
        .exercise-transition-in  { animation: slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .exercise-transition-out { animation: slideOutLeft  0.25s ease-in both; }

        /* ── Confettis ── */
        @keyframes confettiFall {
            0%   { transform: translateY(-20px) rotate(0deg); opacity:1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
        }
        .confetti-piece {
            position: fixed;
            top: -20px;
            width: 10px;
            height: 10px;
            border-radius: 2px;
            animation: confettiFall linear forwards;
            pointer-events: none;
            z-index: 99999;
        }

        /* ── Stats visuelles fin de séance ── */
        @keyframes countUp {
            from { transform: scale(0.5); opacity:0; }
            to   { transform: scale(1);   opacity:1; }
        }
        .completion-stat-animate { animation: countUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── Bandeau repos ── */
        #globalRestBanner { transition: transform 0.3s ease; }
        #globalRestBanner.visible { transform: translateY(0); }

        /* RPE buttons mobile */
        @media (max-width: 640px) {
            #inlineRPEBtns button { min-width: 0; padding: 6px 0 !important; font-size: 0.7em !important; }
            #inlineRestSelect { font-size: 0.78em !important; }
        }

        @keyframes breathe {
            0%, 100% { transform: scale(1);   opacity: 0.9; }
            50%       { transform: scale(1.12); opacity: 1;   }
        }

        /* ── MICRO-ANIMATIONS ────────────────────────────────────── */
        @keyframes check-pop {
            0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
            60%  { transform: scale(1.3) rotate(5deg);  opacity: 1; }
            100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes flash-green {
            0%, 100% { background: inherit; }
            30%      { background: rgba(74,222,128,0.2); }
        }
        .progress-item.completed { animation: flash-green 0.6s ease; }
        .progress-item.completed .progress-checkbox {
            animation: check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .btn:active { transform: scale(0.97); }

        /* ── MODE PAYSAGE — séance en cours ─────────────────────── */
        @media (orientation: landscape) and (max-height: 500px) {
            /* Cache la nav et le header pendant la séance pour maximiser l'espace */
            body.session-fullscreen .nav-tabs,
        body.session-fullscreen #appHeader,
        body.session-fullscreen .header { display: none !important; }
        body.session-fullscreen .container { padding: 0 !important; max-width: 100% !important; }
        body.session-fullscreen #exerciseView { border-radius: 0 !important; }

        body.in-session .nav-tabs,
            body.in-session .header { display: none !important; }

            body.in-session .container { padding: 0 8px !important; }

            /* Layout 2 colonnes : timer à gauche, contrôles à droite */
            body.in-session .timer {
                display: grid !important;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: auto;
                gap: 0 16px;
                padding: 8px 12px !important;
                align-items: center;
            }

            body.in-session .exercise-name   { grid-column: 1/3; font-size:1em !important; margin-bottom:4px !important; }
            body.in-session .timer-display   { font-size:3.5em !important; margin:0 !important; grid-column:1; }
            body.in-session .exercise-number { grid-column:1; font-size:0.75em !important; }
            body.in-session .timer-controls  { grid-column:2; display:flex; flex-direction:column; gap:8px !important; }
            body.in-session .timer-controls button { padding:10px 12px !important; font-size:0.85em !important; }
            body.in-session .exercise-timer-images { display:none !important; }

            /* Repos overlay en paysage */
            #restCountDisplay { font-size: clamp(4rem,15vw,6rem) !important; }
            #restBtns button   { padding: 10px 0 !important; }
        }
        @keyframes skeleton-shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position:  400px 0; }
        }
        .skeleton {
            background: linear-gradient(90deg,
                rgba(255,255,255,0.06) 25%,
                rgba(255,255,255,0.12) 50%,
                rgba(255,255,255,0.06) 75%
            );
            background-size: 800px 100%;
            animation: skeleton-shimmer 1.4s infinite linear;
            border-radius: 8px;
        }
        .skeleton-card  { height: 100px; border-radius: 14px; margin-bottom: 10px; }
        .skeleton-row   { height: 18px;  border-radius: 6px;  margin-bottom: 8px; }
        .skeleton-row.short { width: 55%; }
        .skeleton-title { height: 24px;  border-radius: 6px;  margin-bottom: 14px; width: 60%; }
        .skeleton-avatar{ height: 64px; width: 64px; border-radius: 50%; flex-shrink: 0; }

        #restOverlay {
            display: none;
            position: fixed; inset: 0; z-index: 9990;
            background: #090e14;
            flex-direction: column;
            align-items: center; justify-content: center;
            text-align: center;
            padding: 20px 20px 28px;
            animation: restFadeIn 0.3s ease;
            gap: 0;
        }
        #restOverlay.active { display: flex; }

        @keyframes restFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        @keyframes restCardSlide {
            from { opacity: 0; transform: translateY(22px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes restEmojiPop {
            0%   { transform: scale(0.5); opacity:0; }
            70%  { transform: scale(1.15); }
            100% { transform: scale(1); opacity:1; }
        }
        @keyframes restPulseGlow {
            0%, 100% { filter: drop-shadow(0 0 8px rgba(34,197,94,0.35)); }
            50%       { filter: drop-shadow(0 0 22px rgba(34,197,94,0.7)); }
        }

        #restLabelTop {
            font-size: 0.62rem; font-weight: 700; letter-spacing: 4px;
            color: rgba(255,255,255,0.28); text-transform: uppercase;
            margin-bottom: 14px;
        }

        /* ── Ring wrap ── */
        #restRingWrap {
            position: relative;
            width: clamp(160px, 48vw, 210px);
            height: clamp(160px, 48vw, 210px);
            flex-shrink: 0;
            animation: restPulseGlow 2.4s ease-in-out infinite;
        }
        #restRingSVG {
            width: 100%; height: 100%;
        }
        #restCountDisplay {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -56%);
            font-size: clamp(3.2rem, 16vw, 5.5rem);
            font-weight: 900; color: white; line-height: 1;
            letter-spacing: -3px;
        }
        #restSecLabel {
            position: absolute;
            bottom: 24%; left: 50%;
            transform: translateX(-50%);
            font-size: 0.72rem; font-weight: 700; letter-spacing: 2px;
            color: rgba(255,255,255,0.35); text-transform: uppercase;
        }

        #restLabelBottom {
            font-size: 0.68rem; font-weight: 600; letter-spacing: 2px;
            color: #22c55e; text-transform: uppercase; margin-top: 10px;
        }

        /* ── Carte prochain exercice ── */
        #restNextCard {
            background: rgba(34,197,94,0.07);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: 20px;
            padding: 16px 24px 18px;
            margin-top: 22px;
            max-width: 320px; width: 100%;
            animation: restCardSlide 0.45s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        #restNextLabel {
            font-size: 0.58rem; color: rgba(34,197,94,0.7);
            letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 8px;
            font-weight: 700;
        }
        #restNextEmoji {
            font-size: 2.2em; line-height: 1;
            margin-bottom: 6px;
            animation: restEmojiPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;
            display: block;
        }
        #restNextName {
            font-size: 1.1rem; font-weight: 800; color: white;
            line-height: 1.25; margin-bottom: 6px;
        }
        #restNextMuscle {
            display: inline-block;
            background: rgba(34,197,94,0.15);
            border: 1px solid rgba(34,197,94,0.3);
            border-radius: 99px;
            padding: 3px 12px;
            font-size: 0.7rem; font-weight: 700;
            color: #86efac; letter-spacing: 0.5px;
            margin-top: 2px;
        }
        #restNextBar {
            height: 3px;
            background: rgba(34,197,94,0.15);
            border-radius: 99px;
            margin-top: 12px;
            overflow: hidden;
        }
        #restNextBar::after {
            content: '';
            display: block;
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #4ade80);
            border-radius: 99px;
            animation: restBarFill 0.6s ease 0.3s both;
            transform-origin: left;
        }
        @keyframes restBarFill {
            from { transform: scaleX(0); }
            to   { transform: scaleX(1); }
        }

        /* Boutons repos */
        #restBtns {
            display: flex; gap: 10px; margin-top: 20px;
            width: 100%; max-width: 320px;
        }
        .rest-btn-adj {
            flex: 1; padding: 13px 0;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 14px; color: rgba(255,255,255,0.6);
            font-size: 0.88rem; font-weight: 700; cursor: pointer;
            transition: background 0.2s;
        }
        .rest-btn-adj:active { background: rgba(255,255,255,0.13); }
        #restSkipBtn {
            flex: 2; padding: 13px 0;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: none; border-radius: 14px; color: white;
            font-size: 0.95rem; font-weight: 800; cursor: pointer;
            box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
            transition: transform 0.15s;
        }
        #restSkipBtn:active { transform: scale(0.97); }

        /* ── COMPTE À REBOURS 3-2-1 ─────────────────────────────── */
        #countdownOverlay {
            position: fixed; inset: 0; z-index: 99998;
            background: linear-gradient(160deg, #0F1014 0%, #1A0A00 60%, #166534 100%);
            display: none;
            align-items: center; justify-content: center;
            flex-direction: column; text-align: center;
        }
        #countdownOverlay.active { display: flex; }
        #countdownNumber {
            font-family: 'Outfit', sans-serif;
            font-size: 14rem; font-weight: 900; color: white;
            letter-spacing: -8px; line-height: 1;
            text-shadow: 0 0 60px rgba(34,197,94,0.6);
        }
        #countdownOverlay.active #countdownNumber {
            animation: countPop 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes countPop {
            from { transform: scale(0.3); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
        }
        #countdownExerciseName {
            color: rgba(196,181,253,0.9); font-size: 1.3em;
            font-weight: 700; margin-top: 10px; letter-spacing: -0.3px;
        }
        #countdownLabel {
            color: rgba(255,255,255,0.5); font-size: 0.9em;
            font-weight: 500; margin-top: 6px; text-transform: uppercase;
            letter-spacing: 1.5px;
        }
    


            body.dark-mode #appHeader {
                background: linear-gradient(135deg, #031a0d 0%, #0d3320 50%, #031a0d 100%) !important;
                border-color: rgba(74,222,128,0.15) !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(22,163,74,0.1) !important;
            }
        


            @keyframes pulse {
                0%, 100% { opacity: 0.2; transform: scaleY(1); }
                50% { opacity: 0.6; transform: scaleY(0.7); }
            }
            
            .header:hover .icon-container {
                transform: scale(1.05) rotate(5deg);
            }
            
            .rpe-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(50px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        


                body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
                h1 { color: #16a34a; }
                .meta { color: #64748b; font-size: 0.9em; margin-bottom: 20px; }
                .stats { display: flex; gap: 20px; margin-bottom: 24px; }
                .stat { background: #f0fdf4; border-radius: 8px; padding: 12px 18px; text-align: center; }
                .stat-val { font-size: 1.6em; font-weight: 900; color: #16a34a; }
                .stat-lbl { font-size: 0.75em; color: #64748b; }
                table { width: 100%; border-collapse: collapse; font-size: 0.88em; }
                th { background: #16a34a; color: white; padding: 10px 12px; text-align: left; }
                td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
                tr:nth-child(even) td { background: #f8fafc; }
                @media print { body { padding: 10px; } }
            