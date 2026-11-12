package br.com.vitalink.modules.institutions;

public final class GeoDistance {
    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private GeoDistance() { }

    public static double meters(double latitude, double longitude, double targetLatitude, double targetLongitude) {
        double lat = Math.toRadians(targetLatitude - latitude);
        double lon = Math.toRadians(targetLongitude - longitude);
        double a = Math.sin(lat / 2) * Math.sin(lat / 2)
            + Math.cos(Math.toRadians(latitude)) * Math.cos(Math.toRadians(targetLatitude))
            * Math.sin(lon / 2) * Math.sin(lon / 2);
        a = Math.min(1, Math.max(0, a));
        return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
