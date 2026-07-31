import { useEffect, useState } from 'react';
import * as Tooltip from 'radix-ui/tooltip';

import type { GitHubData } from '@/api';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ContributionMonth {
  cells: (GitHubData['contributions'][number] | null)[];
  key: string;
  label: string;
}

const monthLabels = Array.from({ length: 12 }, (_, index) => `${String(index + 1)}月`);
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

function AnimatedContributionCount({ count }: { count: number }) {
  const reducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(() => (reducedMotion ? count : 0));

  useEffect(() => {
    if (reducedMotion || count === 0) return undefined;

    const duration = Math.min(700, Math.max(260, count * 35));
    let animationFrame = window.requestAnimationFrame(() => {
      const startedAt = performance.now();
      setVisibleCount(0);

      const update = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        setVisibleCount(Math.round(count * (1 - (1 - progress) ** 3)));
        if (progress < 1) animationFrame = window.requestAnimationFrame(update);
      };

      animationFrame = window.requestAnimationFrame(update);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [count, reducedMotion]);

  return (
    <strong aria-label={`${String(count)} 次贡献`}>
      <span className="contribution-tooltip-count" aria-hidden="true">
        {reducedMotion ? count : visibleCount}
      </span>{' '}
      次贡献
    </strong>
  );
}

function getContributionYear(contributions: readonly GitHubData['contributions'][number][]) {
  return Number(contributions.at(-1)?.date.slice(0, 4) ?? new Date().getFullYear());
}

function buildMonths(
  contributions: readonly GitHubData['contributions'][number][],
  year: number,
): ContributionMonth[] {
  const byDate = new Map(contributions.map((day) => [day.date, day]));

  return monthLabels.map((label, month) => {
    const firstDay = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells: ContributionMonth['cells'] = Array.from({ length: firstDay }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${String(year)}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push(byDate.get(date) ?? { count: 0, date, level: 0 });
    }

    while (cells.length % 7 !== 0) cells.push(null);

    return { cells, key: `${String(year)}-${String(month)}`, label };
  });
}

export function ContributionHeatmap({ contributions }: Pick<GitHubData, 'contributions'>) {
  const year = getContributionYear(contributions);
  const months = buildMonths(contributions, year);
  const total = contributions.reduce((sum, day) => sum + day.count, 0);

  return (
    <section className="github-heatmap" aria-labelledby="contributions-title">
      <div className="contribution-heading">
        <h3 id="contributions-title">贡献记录</h3>
        <p>
          {year} | {total} 次贡献
        </p>
      </div>
      <Tooltip.Provider delayDuration={120}>
        <div className="contribution-chart" aria-label="GitHub 年度贡献记录">
          <div className="contribution-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="contribution-month-viewport">
            <ol className="contribution-months">
              {months.map((month) => (
                <li className="contribution-month" key={month.key}>
                  <ol
                    className="contribution-month-grid"
                    aria-label={`${String(year)}年${month.label}`}
                  >
                    {month.cells.map((day, index) =>
                      day === null ? (
                        <li
                          className="contribution-cell is-placeholder"
                          key={`${month.key}-${String(index)}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <li key={day.date}>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button
                                className="contribution-cell"
                                type="button"
                                data-level={day.level}
                                aria-label={`${day.date}: ${String(day.count)} 次贡献`}
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="contribution-tooltip"
                                side="top"
                                sideOffset={8}
                              >
                                <span>{day.date}</span>
                                <AnimatedContributionCount count={day.count} />
                                <Tooltip.Arrow className="contribution-tooltip-arrow" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </li>
                      ),
                    )}
                  </ol>
                  <span className="contribution-month-label">{month.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Tooltip.Provider>
    </section>
  );
}
