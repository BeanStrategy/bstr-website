import Image from 'next/image'

interface BeanIconProps {
  size?: number
  className?: string
}

export default function BeanIcon({ size = 20, className = '' }: BeanIconProps) {
  return (
    <Image
      src="/images/bean.png"
      alt="BEAN"
      width={size}
      height={size}
      className={`inline-block rounded-full ${className}`}
    />
  )
}
