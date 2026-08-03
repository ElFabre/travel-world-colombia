import {
  Anchor, Award, Baby, Backpack, Banknote, Bed, Beer, Bike, Binoculars, Bird,
  Briefcase, Building, Building2, Bus, Calendar, Calendar1, CalendarDays, Camera,
  Car, Castle, Church, Clock, CloudSun, Coffee, Coins, Compass, CreditCard, Crown,
  Dog, Droplet, FileCheck, Fish, Flag, Flower, Footprints, Gift, Globe, Heart,
  Hotel, House, IdCard, Image as ImageIcon, Key, Landmark, Languages, LifeBuoy, MapPin, Mountain,
  MountainSnow, Music, Palette, Phone, Plane, Plug, Sailboat, Ship, ShieldCheck,
  ShoppingBag, Snowflake, Sparkles, Star, Sun, Sunset, Tent, Thermometer, Ticket,
  TrainFront, TreePalm, Trees, Umbrella, Users, Utensils, Wallet, WavesHorizontal,
  Wifi, Wind, Wine, Zap,
} from 'lucide-react'
import type { CSSProperties, ComponentType } from 'react'

export type IconCmp = ComponentType<{
  size?: number
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}>

/**
 * Catálogo de iconos disponibles para el contenido del panel (información clave
 * y experiencias destacadas), con el nombre kebab-case que se guarda en la BD.
 *
 * Es una lista CURADA a propósito: antes se importaba el mapa `icons` completo
 * de lucide, lo que metía el set entero (cientos de KB) en el bundle de cada
 * ficha de destino. Con imports nombrados solo viaja lo que está aquí.
 *
 * Al agregar un icono nuevo basta con sumarlo a este objeto: el selector del
 * panel se alimenta de las mismas claves, así que nunca se puede guardar un
 * icono que la web no sepa dibujar.
 */
export const ICONOS: Record<string, IconCmp> = {
  // Viaje y transporte
  plane: Plane, bus: Bus, car: Car, ship: Ship, sailboat: Sailboat,
  'train-front': TrainFront, bike: Bike, anchor: Anchor, ticket: Ticket,
  // Lugar y orientación
  'map-pin': MapPin, globe: Globe, compass: Compass, landmark: Landmark,
  building: Building, 'building-2': Building2, castle: Castle, church: Church,
  home: House, house: House, hotel: Hotel, bed: Bed, tent: Tent,
  // Alias heredados del contenido antiguo (no existen en lucide con ese nombre).
  torii: Landmark, tower: Landmark,
  // Tiempo y fechas
  calendar: Calendar, calendar1: Calendar1, 'calendar-1': Calendar1,
  'calendar-days': CalendarDays, clock: Clock,
  // Dinero
  wallet: Wallet, banknote: Banknote, 'credit-card': CreditCard, coins: Coins,
  // Clima y naturaleza
  thermometer: Thermometer, sun: Sun, sunset: Sunset, 'cloud-sun': CloudSun,
  umbrella: Umbrella, droplet: Droplet, wind: Wind, snowflake: Snowflake,
  waves: WavesHorizontal, 'waves-horizontal': WavesHorizontal,
  palmtree: TreePalm, 'tree-palm': TreePalm, mountain: Mountain,
  'mountain-snow': MountainSnow, trees: Trees, flower: Flower,
  // Comida
  utensils: Utensils, coffee: Coffee, wine: Wine, beer: Beer,
  // Actividades y cultura
  camera: Camera, binoculars: Binoculars, music: Music, palette: Palette,
  'shopping-bag': ShoppingBag, gift: Gift, footprints: Footprints,
  backpack: Backpack, sparkles: Sparkles, crown: Crown,
  // Personas y fauna
  users: Users, baby: Baby, dog: Dog, fish: Fish, bird: Bird,
  // Trámites y seguridad
  'shield-check': ShieldCheck, 'file-check': FileCheck, 'id-card': IdCard,
  languages: Languages, key: Key, flag: Flag, award: Award,
  'life-buoy': LifeBuoy, briefcase: Briefcase,
  // Servicios
  phone: Phone, wifi: Wifi, zap: Zap, plug: Plug,
  // Símbolos
  heart: Heart, star: Star,
  // Usado en código (placeholder cuando un viaje no tiene foto "sobre el destino").
  image: ImageIcon,
}

/** Nombres disponibles, ordenados para el selector del panel. */
export const NOMBRES_ICONOS = Object.keys(ICONOS).sort()
