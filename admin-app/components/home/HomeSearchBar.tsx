'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconLocation, IconSearch, IconArrowRight } from '../icons/SvgIcons';

type HomeSearchBarProps = {
  locale: 'en' | 'th';
};

type SearchTab = 'buy' | 'rent' | 'offplan' | 'villas';

export function HomeSearchBar({ locale }: HomeSearchBarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTab>('buy');

  // Filter selections
  const [location, setLocation] = useState<string>('Any');
  const [propType, setPropType] = useState<string>('Any');
  const [bedrooms, setBedrooms] = useState<string>('Any');
  const [budget, setBudget] = useState<string>('Any');

  // Dropdown open states
  const [activeDropdown, setActiveDropdown] = useState<'location' | 'type' | 'bedrooms' | 'budget' | null>(null);

  // Dropdown refs for click-outside detection
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Options configuration
  const locations = [
    { value: 'Any', label: locale === 'th' ? 'ทุกทำเลในพัทยา' : 'Anywhere in Pattaya' },
    { value: 'central', label: locale === 'th' ? 'พัทยากลาง' : 'Central Pattaya' },
    { value: 'jomtien', label: locale === 'th' ? 'จอมเทียน' : 'Jomtien' },
    { value: 'pratumnak', label: locale === 'th' ? 'พระตำหนัก' : 'Pratumnak' },
    { value: 'wongamat', label: locale === 'th' ? 'วงศ์อมาตย์' : 'Wongamat' },
    { value: 'na jomtien', label: locale === 'th' ? 'นาจอมเทียน' : 'Na Jomtien' },
    { value: 'huay yai', label: locale === 'th' ? 'ห้วยใหญ่' : 'Huay Yai' },
  ];

  const propTypes = [
    { value: 'Any', label: locale === 'th' ? 'ทุกประเภท' : 'Condo, Villa, Penthouse' },
    { value: 'condo', label: locale === 'th' ? 'คอนโด' : 'Condo' },
    { value: 'villa', label: locale === 'th' ? 'พูลวิลล่า / บ้าน' : 'Villa / House' },
    { value: 'penthouse', label: locale === 'th' ? 'เพนท์เฮ้าส์' : 'Penthouse' },
  ];

  const bedroomOptions = [
    { value: 'Any', label: locale === 'th' ? 'ทุกขนาดห้องนอน' : 'Studio – 4+ Bedrooms' },
    { value: 'studio', label: locale === 'th' ? 'สตูดิโอ' : 'Studio' },
    { value: '1', label: locale === 'th' ? '1 ห้องนอน' : '1 Bedroom' },
    { value: '2', label: locale === 'th' ? '2 ห้องนอน' : '2 Bedrooms' },
    { value: '3', label: locale === 'th' ? '3 ห้องนอน' : '3 Bedrooms' },
    { value: '4+', label: locale === 'th' ? '4 ห้องนอนขึ้นไป' : '4+ Bedrooms' },
  ];

  const budgets = [
    { value: 'Any', label: locale === 'th' ? 'ทุกช่วงราคา' : '฿3M – ฿20M+' },
    { value: 'lt_3m', label: locale === 'th' ? 'ต่ำกว่า 3 ล้านบาท' : 'Under ฿3M' },
    { value: '3m_6m', label: locale === 'th' ? '3 ล้าน – 6 ล้านบาท' : '฿3M – ฿6M' },
    { value: '6m_10m', label: locale === 'th' ? '6 ล้าน – 10 ล้านบาท' : '฿6M – ฿10M' },
    { value: '10m_20m', label: locale === 'th' ? '10 ล้าน – 20 ล้านบาท' : '฿10M – ฿20M' },
    { value: 'gt_20m', label: locale === 'th' ? '20 ล้านบาทขึ้นไป' : 'Above ฿20M' },
  ];

  const buildSearchHref = (tab: SearchTab = activeTab) => {
    const params = new URLSearchParams();
    params.set('source', 'home_search_bar');

    if (location !== 'Any') {
      params.set('location', location);
    }

    if (propType !== 'Any') {
      params.set('type', propType);
    }

    if (bedrooms !== 'Any') {
      if (bedrooms === 'studio') {
        params.set('bedrooms', '0');
      } else if (bedrooms === '4+') {
        params.set('bedrooms', '4');
      } else {
        params.set('bedrooms', bedrooms);
      }
    }

    if (budget !== 'Any') {
      if (budget === 'lt_3m') {
        params.set('priceMax', '3000000');
      } else if (budget === '3m_6m') {
        params.set('priceMin', '3000000');
        params.set('priceMax', '6000000');
      } else if (budget === '6m_10m') {
        params.set('priceMin', '6000000');
        params.set('priceMax', '10000000');
      } else if (budget === '10m_20m') {
        params.set('priceMin', '10000000');
        params.set('priceMax', '20000000');
      } else if (budget === 'gt_20m') {
        params.set('priceMin', '20000000');
      }
    }

    let route = `/${locale}/buy`;
    if (tab === 'rent') {
      route = `/${locale}/rent`;
    } else if (tab === 'offplan') {
      route = `/${locale}/projects`;
      params.set('status', 'off-plan');
    } else if (tab === 'villas') {
      route = `/${locale}/buy`;
      params.set('type', 'villa');
    }

    const queryString = params.toString();
    return queryString ? `${route}?${queryString}` : route;
  };

  const handleSearch = () => {
    router.push(buildSearchHref());
  };

  const getActiveLabel = (value: string, options: Array<{ value: string; label: string }>) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <div
      ref={containerRef}
      className="home-search-shell relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 md:-mt-14 lg:-mt-16 xl:-mt-20 select-none pb-8"
      data-testid="home-search-bar"
    >
      <div className="home-search-shell__panel bg-[#fcfaf2] border border-[#d8cdb4] shadow-2xl rounded-2xl md:rounded-3xl p-4 sm:p-5 lg:p-6 transition-all duration-300">
        {/* Search Tabs */}
        <div className="home-search-shell__tabs flex items-center gap-1.5 sm:gap-2 mb-4 md:mb-5 pb-3 border-b border-[#efe6d2]">
          {[
            { id: 'buy', label: locale === 'th' ? 'ซื้อ (Buy)' : 'Buy' },
            { id: 'rent', label: locale === 'th' ? 'เช่า (Rent)' : 'Rent' },
            { id: 'offplan', label: locale === 'th' ? 'พรีเซลล์ / โครงการใหม่' : 'Off-plan' },
            { id: 'villas', label: locale === 'th' ? 'วิลล่า (Villas)' : 'Villas' },
          ].map((tab) => (
            <a
              key={tab.id}
              href={buildSearchHref(tab.id as SearchTab)}
              onClick={(event) => {
                event.preventDefault();
                setActiveTab(tab.id as SearchTab);
                setActiveDropdown(null);
              }}
              aria-current={activeTab === tab.id ? 'true' : undefined}
              className={`home-search-shell__tab px-3.5 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-[#0e3a3a] text-[#f8f4ea] shadow-md'
                  : 'text-[#5b6764] hover:bg-[#efe6d2]/50 hover:text-[#0e3a3a]'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Search Inputs Row */}
        <div className="home-search-shell__grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2 lg:gap-0 lg:divide-x lg:divide-[#d8cdb4] items-center bg-white rounded-xl lg:rounded-2xl border border-[#efe6d2] overflow-visible p-2 lg:p-1.5">
          {/* Location Selector */}
          <div className="home-search-shell__field relative w-full overflow-visible">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
              className={`home-search-shell__control w-full flex flex-col justify-start text-left px-4 py-3 sm:py-3.5 rounded-xl hover:bg-[#f8f4ea]/40 transition-colors ${
                activeDropdown === 'location' ? 'bg-[#f8f4ea]/60' : ''
              }`}
            >
              <span className="text-[10px] sm:text-xs font-semibold text-[#c9a677] uppercase tracking-wider mb-0.5">
                {locale === 'th' ? 'ทำเลที่ตั้ง' : 'Location'}
              </span>
              <span className="text-sm font-serif font-semibold text-[#14201f] truncate flex items-center gap-1.5">
                <IconLocation className="text-[#d96a4e] flex-shrink-0" size="sm" />
                {getActiveLabel(location, locations)}
              </span>
            </button>
            {activeDropdown === 'location' && (
              <div className="home-search-shell__dropdown absolute left-0 right-0 lg:w-72 mt-2 bg-white border border-[#efe6d2] shadow-xl rounded-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                {locations.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setLocation(opt.value);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      location === opt.value
                        ? 'bg-[#0e3a3a] text-white font-medium'
                        : 'text-[#14201f] hover:bg-[#f8f4ea]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property Type Selector */}
          <div className="home-search-shell__field relative w-full overflow-visible">
            <button
              type="button"
              disabled={activeTab === 'villas'}
              onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
              className={`home-search-shell__control w-full flex flex-col justify-start text-left px-4 py-3 sm:py-3.5 rounded-xl hover:bg-[#f8f4ea]/40 transition-colors ${
                activeTab === 'villas' ? 'opacity-50 cursor-not-allowed' : ''
              } ${activeDropdown === 'type' ? 'bg-[#f8f4ea]/60' : ''}`}
            >
              <span className="text-[10px] sm:text-xs font-semibold text-[#c9a677] uppercase tracking-wider mb-0.5">
                {locale === 'th' ? 'ประเภททรัพย์' : 'Property Type'}
              </span>
              <span className="text-sm font-serif font-semibold text-[#14201f] truncate">
                {activeTab === 'villas'
                  ? locale === 'th'
                    ? 'พูลวิลล่า / บ้าน'
                    : 'Villa / House'
                  : getActiveLabel(propType, propTypes)}
              </span>
            </button>
            {activeDropdown === 'type' && activeTab !== 'villas' && (
              <div className="home-search-shell__dropdown absolute left-0 right-0 lg:w-64 mt-2 bg-white border border-[#efe6d2] shadow-xl rounded-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                {propTypes.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPropType(opt.value);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      propType === opt.value
                        ? 'bg-[#0e3a3a] text-white font-medium'
                        : 'text-[#14201f] hover:bg-[#f8f4ea]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bedrooms Selector */}
          <div className="home-search-shell__field relative w-full overflow-visible">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'bedrooms' ? null : 'bedrooms')}
              className={`home-search-shell__control w-full flex flex-col justify-start text-left px-4 py-3 sm:py-3.5 rounded-xl hover:bg-[#f8f4ea]/40 transition-colors ${
                activeDropdown === 'bedrooms' ? 'bg-[#f8f4ea]/60' : ''
              }`}
            >
              <span className="text-[10px] sm:text-xs font-semibold text-[#c9a677] uppercase tracking-wider mb-0.5">
                {locale === 'th' ? 'ห้องนอน' : 'Bedrooms'}
              </span>
              <span className="text-sm font-serif font-semibold text-[#14201f] truncate">
                {getActiveLabel(bedrooms, bedroomOptions)}
              </span>
            </button>
            {activeDropdown === 'bedrooms' && (
              <div className="home-search-shell__dropdown absolute left-0 right-0 lg:w-64 mt-2 bg-white border border-[#efe6d2] shadow-xl rounded-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                {bedroomOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setBedrooms(opt.value);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      bedrooms === opt.value
                        ? 'bg-[#0e3a3a] text-white font-medium'
                        : 'text-[#14201f] hover:bg-[#f8f4ea]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Budget Selector */}
          <div className="home-search-shell__field relative w-full overflow-visible">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
              className={`home-search-shell__control w-full flex flex-col justify-start text-left px-4 py-3 sm:py-3.5 rounded-xl hover:bg-[#f8f4ea]/40 transition-colors ${
                activeDropdown === 'budget' ? 'bg-[#f8f4ea]/60' : ''
              }`}
            >
              <span className="text-[10px] sm:text-xs font-semibold text-[#c9a677] uppercase tracking-wider mb-0.5">
                {locale === 'th' ? 'ช่วงงบประมาณ' : 'Budget'}
              </span>
              <span className="text-sm font-serif font-semibold text-[#14201f] truncate">
                {getActiveLabel(budget, budgets)}
              </span>
            </button>
            {activeDropdown === 'budget' && (
              <div className="home-search-shell__dropdown absolute left-0 right-0 lg:w-64 mt-2 bg-white border border-[#efe6d2] shadow-xl rounded-xl p-2 z-50 animate-in slide-in-from-top-1 duration-200">
                {budgets.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setBudget(opt.value);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      budget === opt.value
                        ? 'bg-[#0e3a3a] text-white font-medium'
                        : 'text-[#14201f] hover:bg-[#f8f4ea]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search CTA Button */}
          <div className="home-search-shell__submit-wrap w-full lg:w-auto p-2 lg:p-0 flex justify-end">
            <a
              href={buildSearchHref()}
              onClick={(event) => {
                event.preventDefault();
                handleSearch();
              }}
              className="home-search-shell__submit w-full lg:w-auto h-12 sm:h-14 px-6 sm:px-8 bg-[#d96a4e] hover:bg-[#c4533a] active:scale-95 text-[#f8f4ea] font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <IconSearch size="sm" />
              <span>{locale === 'th' ? 'ค้นหาทรัพย์' : 'Search Listings'}</span>
              <IconArrowRight size="sm" className="hidden lg:inline" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
